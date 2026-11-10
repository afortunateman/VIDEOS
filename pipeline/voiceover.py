"""Step 2: script.txt -> ElevenLabs voiceover -> sped up, silences trimmed.

    ELEVENLABS_API_KEY=... python pipeline/voiceover.py projects/<name>
    python pipeline/voiceover.py projects/<name> --clean-only   # re-run ffmpeg on voice_raw.mp3

Writes voice_raw.mp3 (straight from ElevenLabs) and voice.flac (what the
rest of the pipeline uses). The key is read from the environment and never
written to disk.
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

from common import project_dir, settings


def tts(text, s, out_path):
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        sys.exit("Set ELEVENLABS_API_KEY first (it is never saved to the project).")
    url = (f"https://api.elevenlabs.io/v1/text-to-speech/{s['voice_id']}"
           "?output_format=mp3_44100_128")
    body = {
        "text": text,
        "model_id": s["model_id"],
        "voice_settings": s.get("voice_settings",
                                {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35}),
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST", headers={
        "xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            out_path.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs error {e.code}: {e.read().decode(errors='replace')[:500]}")


def clean(src, dst, s):
    """Trim long pauses, speed up, level the loudness."""
    db = s["silence_db"]
    keep = s["max_silence"]
    af = ",".join([
        # drop leading silence, then cap every pause at `keep` seconds
        f"silenceremove=start_periods=1:start_threshold={db}dB:start_silence=0.05"
        f":stop_periods=-1:stop_duration={keep}:stop_threshold={db}dB:stop_silence={keep}",
        f"atempo={s['speed']}",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        "aresample=48000",
    ])
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
                    "-af", af, "-ac", "1", str(dst)], check=True)


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def main():
    pdir = project_dir()
    s = settings(pdir)
    raw = pdir / "voice_raw.mp3"
    if "--clean-only" not in sys.argv:
        text = (pdir / "script.txt").read_text(encoding="utf-8").strip()
        print(f"Generating voice ({len(text)} chars, voice {s['voice_id']})...")
        tts(text, s, raw)
    out = pdir / "voice.flac"
    clean(raw, out, s)
    print(f"voice_raw.mp3 {duration(raw):.2f}s -> voice.flac {duration(out):.2f}s")


if __name__ == "__main__":
    main()
