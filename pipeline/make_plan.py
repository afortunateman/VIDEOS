"""Step 5: shots.json + words.json -> plan.json (camera and cast for every frame).

    python pipeline/make_plan.py projects/<name>

Open pipeline/planner/planner.html to scrub through the result in Three.js
before spending GPU time on it. Blender (step 7) reads the same plan.json, so
what you see in the planner is what gets rendered.
"""
import math
import subprocess
import sys

from common import (ease, expand_set, frames_for, lerp, load_json, project_dir,
                    resolve_time, save_json, settings)

POP_FRAMES = 5      # squash-and-settle when a pose changes
DEFAULT_HEIGHT = 1.8


def audio_duration(path):
    if not path.exists():
        return 0.0
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "csv=p=0", str(path)], capture_output=True, text=True)
        return float(out.stdout.strip())
    except (OSError, ValueError):
        return 0.0


def shake(t, amp, seed):
    if not amp:
        return [0.0, 0.0, 0.0]
    return [amp * (math.sin(t * 23.1 + seed) * 0.6 + math.sin(t * 41.7 + seed * 2) * 0.4)
            for seed in (seed, seed + 1.3, seed + 2.9)]


def r(v, n=4):
    return [round(x, n) for x in v] if isinstance(v, list) else round(v, n)


def main():
    pdir = project_dir()
    s = settings(pdir)
    fps = s["fps"]
    words = load_json(pdir / "words.json")
    spec = load_json(pdir / "shots.json")
    cast = spec.get("cast", {})

    duration = max(words[-1]["end"] + s["tail"], audio_duration(pdir / "voice.flac"))
    n_frames = frames_for(duration, fps)

    # --- resolve shot boundaries
    shots = spec["shots"]
    starts = []
    for i, sh in enumerate(shots):
        t = 0.0 if i == 0 else resolve_time(sh.get("at", 0), words, after=starts[-1])
        if i and t < starts[-1]:
            sys.exit(f"shot {i} starts before shot {i - 1}; check its 'at'")
        starts.append(t)
    ends = starts[1:] + [duration]

    # --- resolve timed things inside each shot
    poses_used = {}
    props, sfx = [], []
    for i, sh in enumerate(shots):
        t0 = starts[i]
        for c in sh.get("chars", []):
            changes = [(t0, c.get("pose", "idle"))]
            for p in c.get("poses", []):
                changes.append((resolve_time(p["at"], words, after=t0), p["pose"]))
            c["_changes"] = sorted(changes)
            for _, pose in changes:
                poses_used.setdefault(c["name"], set()).add(pose)
            if "to" in c:
                walk = c.get("walk", [None, None])
                c["_walk"] = (resolve_time(walk[0], words, after=t0) if walk[0] is not None else t0,
                              resolve_time(walk[1], words, after=t0) if walk[1] is not None else ends[i])
        for p in sh.get("props", []):
            ev = {k: v for k, v in p.items() if k not in ("at", "until")}
            t = resolve_time(p["at"], words, after=t0) if "at" in p else t0
            ev["frame"] = int(round(t * fps))
            if "until" in p:
                ev["end_frame"] = int(round(resolve_time(p["until"], words, after=t0) * fps))
            elif ev["type"] == "car":
                ev["end_frame"] = int(round(ends[i] * fps))
            props.append(ev)
        for e in sh.get("sfx", []):
            sfx.append({"file": e["file"], "gain": e.get("gain", 0),
                        "time": round(resolve_time(e["at"], words, after=t0), 3)})
    for e in spec.get("sfx", []):
        sfx.append({"file": e["file"], "gain": e.get("gain", 0),
                    "time": round(resolve_time(e["at"], words), 3)})

    # --- check every cutout exists before anyone renders
    missing = [f"cutouts/{n}/{p}.png" for n, ps in poses_used.items() for p in sorted(ps)
               if not (pdir / "cutouts" / n / f"{p}.png").exists()]
    if missing:
        print("Missing character cutouts (run step 4: node pipeline/characters/export_cutouts.js):")
        print("  " + "\n  ".join(missing))
        if "--allow-missing" not in sys.argv:
            sys.exit(1)

    # --- bake every frame
    frames = []
    si = 0
    for f in range(n_frames):
        t = f / fps
        while si + 1 < len(shots) and t >= starts[si + 1]:
            si += 1
        sh, t0, t1 = shots[si], starts[si], ends[si]
        u = (t - t0) / max(1e-6, t1 - t0)
        cam = sh["camera"]
        k = ease(cam.get("ease", "inout"), u)
        pos = lerp(cam["from"], cam.get("to", cam["from"]), k)
        look = lerp(cam["look"], cam.get("look_to", cam["look"]), k)
        lens = lerp(cam.get("lens", 35), cam.get("lens_to", cam.get("lens", 35)), k)
        sh_off = shake(t, cam.get("shake", 0), si)
        pos = [a + b for a, b in zip(pos, sh_off)]

        chars = []
        for c in sh.get("chars", []):
            pose, changed_at = c["_changes"][0][1], c["_changes"][0][0]
            for ct, cp in c["_changes"]:
                if t + 1e-6 >= ct:
                    pose, changed_at = cp, ct
            cpos = c.get("pos", [0, 0, 0])
            if "_walk" in c:
                w0, w1 = c["_walk"]
                cpos = lerp(cpos, c["to"], ease(c.get("walk_ease", "inout"), (t - w0) / max(1e-6, w1 - w0)))
            df = (t - changed_at) * fps
            pop = 1 + 0.12 * (1 - ease("out", df / POP_FRAMES)) if changed_at > t0 and df < POP_FRAMES else 1.0
            breathe = 1 + 0.012 * math.sin(t * 2 * math.pi * 0.6 + sum(map(ord, c["name"])) % 7)
            chars.append({
                "name": c["name"], "pose": pose, "pos": r(cpos),
                "h": c.get("height", cast.get(c["name"], {}).get("height", DEFAULT_HEIGHT)),
                "flip": c.get("face", "right") == "left",
                "sx": round(pop, 4), "sz": round(pop * breathe, 4),
            })
        frames.append({"shot": si, "cam": {"pos": r(pos), "look": r(look), "lens": r(lens, 2)},
                       "chars": chars})

    plan = {
        "title": s["title"], "fps": fps, "width": s["width"], "height": s["height"],
        "samples": s["samples"], "duration": round(duration, 3),
        "shots": [{"start": round(a, 3), "end": round(b, 3)} for a, b in zip(starts, ends)],
        "set": expand_set(spec.get("set", "stage")),
        "cast": {n: sorted(p) for n, p in poses_used.items()},
        "props": props, "sfx": sorted(sfx, key=lambda e: e["time"]),
        "frames": frames,
    }
    save_json(pdir / "plan.json", plan, indent=None)
    print(f"plan.json: {len(shots)} shots, {n_frames} frames ({duration:.2f}s @ {fps}fps), "
          f"{len(props)} prop events, {len(sfx)} sound cues")


if __name__ == "__main__":
    main()
