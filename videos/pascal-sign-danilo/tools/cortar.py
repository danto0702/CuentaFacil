# Cuts long pauses out of the owner's talking-head recording (silences > 0.38 s keep 0.12 s on each side) and transcodes to H.264.
# Usage: python cortar.py <input.mp4> <output.mp4>   — writes tools/cortes.json with the kept segments.
import sys, json, subprocess, re, os
src, out = sys.argv[1:3]
log = subprocess.run(['ffmpeg', '-i', src, '-af', 'silencedetect=n=-32dB:d=0.35', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', log)]
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]))
PAD = 0.12; keep = []; cur = 0.0
for a, b in zip(st, en):
    if b - a < 0.38: continue
    if a <= 0.05: cur = max(0, b - 0.25); continue
    keep.append((cur, a + PAD)); cur = b - PAD
if cur < dur - 0.3: keep.append((cur, min(dur, (st[-1] + PAD) if en and en[-1] >= dur - 0.05 else dur)))
keep = [(round(a, 3), round(b, 3)) for a, b in keep if b - a > 0.2]
v = ''.join(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{i}];' for i, (a, b) in enumerate(keep))
v += ''.join(f'[v{i}][a{i}]' for i in range(len(keep))) + f'concat=n={len(keep)}:v=1:a=1[v][a]'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', v, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', '30', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out], check=True)
json.dump(keep, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cortes.json'), 'w'))
print(len(keep), 'segments', round(sum(b - a for a, b in keep), 2), 's')
