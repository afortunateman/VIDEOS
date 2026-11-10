"""Step 3: time every word of voice.flac with Whisper -> words.json.

    pip install faster-whisper      (or: pip install openai-whisper)
    python pipeline/transcribe.py projects/<name>

words.json is a list of {"word", "start", "end"} in seconds. When script.txt
exists, Whisper's spelling is swapped for the script's wherever the two line
up, so captions match what you wrote.
"""
import difflib
import re

from common import project_dir, save_json, settings


def whisper_words(path, model_name, language):
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(model_name, compute_type="int8")
        segments, _ = model.transcribe(str(path), word_timestamps=True, language=language,
                                       vad_filter=False)
        return [{"word": w.word.strip(), "start": w.start, "end": w.end}
                for seg in segments for w in (seg.words or [])]
    except ImportError:
        pass
    try:
        import whisper
    except ImportError:
        raise SystemExit("Install a Whisper: pip install faster-whisper  (or openai-whisper)")
    model = whisper.load_model(model_name)
    res = model.transcribe(str(path), word_timestamps=True, language=language)
    return [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]}
            for seg in res["segments"] for w in seg.get("words", [])]


def _key(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def match_script(words, script):
    """Replace Whisper's text with the script's where the word sequences agree."""
    script_words = script.split()
    a = [_key(w["word"]) for w in words]
    b = [_key(w) for w in script_words]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    fixed = 0
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ("equal", "replace") and i2 - i1 == j2 - j1:
            for i, j in zip(range(i1, i2), range(j1, j2)):
                if words[i]["word"] != script_words[j]:
                    fixed += tag == "replace"
                words[i]["word"] = script_words[j]
    return fixed


def main():
    pdir = project_dir()
    s = settings(pdir)
    audio = pdir / "voice.flac"
    print(f"Transcribing {audio.name} with Whisper {s['whisper_model']}...")
    words = whisper_words(audio, s["whisper_model"], s["language"])
    words = [w for w in words if w["word"]]
    for w in words:
        w["start"], w["end"] = round(w["start"], 3), round(max(w["end"], w["start"] + 0.05), 3)
    script = pdir / "script.txt"
    if script.exists():
        n = match_script(words, script.read_text(encoding="utf-8"))
        print(f"Aligned to script.txt ({n} spellings corrected)")
    save_json(pdir / "words.json", words, indent=None)
    print(f"{len(words)} words, {words[-1]['end']:.2f}s -> words.json")
    print("Index reference for shots.json:")
    print("  " + " ".join(f"{i}:{w['word']}" for i, w in enumerate(words)))


if __name__ == "__main__":
    main()
