import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2], device="cpu", compute_type="int8")
import numpy as np, wave
wf=wave.open(sys.argv[1]); a=np.frombuffer(wf.readframes(wf.getnframes()),np.int16).astype(np.float32)/32768
segs, info = m.transcribe(a, word_timestamps=True, beam_size=5, language=sys.argv[3] if len(sys.argv)>3 else None)
print("LANG", info.language, info.language_probability)
out=[]
for s in segs:
    print(f"[{s.start:.2f}-{s.end:.2f}] {s.text}")
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"w":w.word,"s":w.start,"e":w.end} for w in s.words]})
json.dump(out, open(sys.argv[1]+"."+sys.argv[2]+".json","w"), ensure_ascii=False, indent=1)
