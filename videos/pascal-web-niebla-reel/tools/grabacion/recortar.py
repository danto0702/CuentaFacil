# Reel version: re-paces the original La Niebla recording (../pascal-web-niebla/assets/video/app.mp4) by segments
# (slow where it sells: menu and booking; 4.5x montage for the scroll through the sections) and remaps the step marks.
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(D, '..', '..')
SRC = os.path.join(ROOT, '..', 'pascal-web-niebla', 'assets', 'video', 'app.mp4')
M = json.load(open(os.path.join(D, 'marks-original.json')))
END = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SRC]))
SEG = [(0, M['menu'], 1.15), (M['menu'], M['nosotros'], 1.4), (M['nosotros'], M['carta'], 4.5), (M['carta'], M['reserva'], 1.5), (M['reserva'], END, 1.5)]
def nuevo(t):
    out = 0
    for a, b, v in SEG:
        if t <= b: return out + (max(t, a) - a) / v
        out += (b - a) / v
    return out
parts = ''.join(f'[0:v]trim={a:.3f}:{b:.3f},setpts=(PTS-STARTPTS)/{v}[s{i}];' for i, (a, b, v) in enumerate(SEG))
fc = parts + ''.join(f'[s{i}]' for i in range(len(SEG))) + f'concat=n={len(SEG)}:v=1:a=0,fps=30,format=yuv420p[v]'
out = os.path.join(ROOT, 'assets', 'video', 'app.mp4')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-filter_complex', fc, '-map', '[v]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out], check=True)
json.dump({k: (round(nuevo(v), 3) if not k.startswith('__') else v) for k, v in M.items()}, open(os.path.join(D, 'marks.json'), 'w'), indent=1)
print('nueva duración', round(nuevo(END), 2))
