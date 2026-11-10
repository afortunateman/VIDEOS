"""Shared helpers for every pipeline step.

Standard library only, so it also runs inside Blender's bundled Python
and on a fresh Windows install without pip.
"""
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIPELINE = ROOT / "pipeline"

DEFAULTS = {
    "title": "Untitled",
    "fps": 30,
    "width": 1080,
    "height": 1920,
    # ElevenLabs
    "voice_id": "JBFqnCBsd6RMkjVDRZzb",
    "model_id": "eleven_multilingual_v2",
    # Voice clean-up (step 2)
    "speed": 1.12,            # atempo factor
    "max_silence": 0.18,      # seconds of silence kept between phrases
    "silence_db": -42,
    # Whisper (step 3)
    "whisper_model": "small.en",
    "language": "en",
    # Render (step 7)
    "samples": 16,            # EEVEE samples per frame
    "tail": 0.8,              # seconds held after the last word
    # Final (steps 9-10)
    "caption_font": "Arial Black",
    "caption_size": 120,
    "caption_y": 0.30,        # caption baseline, as a fraction of height from the bottom
    "glow": 0.35,             # 0 disables the glow
    "music": None,            # optional file in the project's sfx/ folder
    "music_db": -20,
}


def project_dir(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--" in argv:  # Blender passes its own args first
        argv = argv[argv.index("--") + 1:]
    if not argv:
        sys.exit("usage: <script> <project-folder>")
    p = Path(argv[0]).resolve()
    if not p.is_dir():
        sys.exit(f"project folder not found: {p}")
    return p


def load_json(path, default=None):
    path = Path(path)
    if not path.exists():
        if default is not None:
            return default
        sys.exit(f"missing file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path, data, indent=1):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, indent=indent), encoding="utf-8")


def settings(pdir):
    s = dict(DEFAULTS)
    s.update(load_json(Path(pdir) / "project.json", {}))
    return s


# ---------------------------------------------------------------- timing

def _norm(w):
    return re.sub(r"[^a-z0-9$%']", "", w.lower())


def resolve_time(spec, words, after=0.0, edge="start"):
    """Turn a timing reference from shots.json into seconds.

    12        -> start of word #12 (0-based)
    "3.5s"    -> 3.5 seconds
    "money"   -> first word "money" at or after `after` seconds
    "money#2" -> second such word
    """
    if spec is None:
        return None
    if isinstance(spec, (int, float)) and not isinstance(spec, bool):
        i = int(spec)
        if not 0 <= i < len(words):
            raise ValueError(f"word index {i} out of range (0-{len(words) - 1})")
        return words[i][edge]
    s = str(spec).strip()
    m = re.fullmatch(r"(-?\d+(?:\.\d+)?)s", s)
    if m:
        return float(m.group(1))
    text, _, nth = s.partition("#")
    nth = int(nth or 1)
    target = _norm(text)
    seen = 0
    for w in words:
        if w["start"] + 1e-6 >= after and _norm(w["word"]) == target:
            seen += 1
            if seen == nth:
                return w[edge]
    raise ValueError(f"word {spec!r} not found after {after:.2f}s")


# ---------------------------------------------------------------- maths

def lerp(a, b, t):
    if isinstance(a, (list, tuple)):
        return [x + (y - x) * t for x, y in zip(a, b)]
    return a + (b - a) * t


EASES = {
    "linear": lambda t: t,
    "in": lambda t: t * t * t,
    "out": lambda t: 1 - (1 - t) ** 3,
    "inout": lambda t: 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2,
    "snap": lambda t: 1 - (1 - t) ** 6,
    "hold": lambda t: 0.0,
}


def ease(name, t):
    t = min(1.0, max(0.0, t))
    return EASES.get((name or "inout").lower().replace("-", "").replace("_", ""), EASES["inout"])(t)


# ---------------------------------------------------------------- sets

def expand_set(set_spec):
    """Resolve a set (name or {"base":..., "extras":[...]}) into a flat list of primitives."""
    library = load_json(PIPELINE / "sets.json")
    if isinstance(set_spec, str):
        set_spec = {"base": set_spec}
    base = set_spec.get("base", "stage")
    if base not in library:
        raise ValueError(f"unknown set {base!r}; choose from {', '.join(library)}")
    src = library[base]
    prims = []
    for p in list(src["objects"]) + list(set_spec.get("extras", [])):
        rep = p.get("repeat")
        if not rep:
            prims.append(_prim(p))
            continue
        counts = rep.get("count", [1, 1, 1]) + [1, 1]
        step = rep.get("step", [0, 0, 0])
        for i in range(counts[0]):
            for j in range(counts[1]):
                for k in range(counts[2]):
                    q = dict(p)
                    q.pop("repeat")
                    q["pos"] = [p.get("pos", [0, 0, 0])[a] + step[a] * (i, j, k)[a] for a in range(3)]
                    prims.append(_prim(q))
    return {
        "name": base,
        "sky": set_spec.get("sky", src.get("sky", "#9fd3ff")),
        "sun": set_spec.get("sun", src.get("sun", {"rot": [50, 0, 30], "strength": 3.0})),
        "objects": prims,
    }


def _prim(p):
    return {
        "shape": p.get("shape", "cube"),
        "pos": list(p.get("pos", [0, 0, 0])),
        "scale": list(p.get("scale", [1, 1, 1])),
        "rot": list(p.get("rot", [0, 0, 0])),
        "color": p.get("color", "#cccccc"),
        "outline": p.get("outline", True),
        "emit": p.get("emit", False),
        "name": p.get("name", p.get("shape", "cube")),
    }


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def frames_for(duration, fps):
    return max(1, int(math.ceil(duration * fps)))
