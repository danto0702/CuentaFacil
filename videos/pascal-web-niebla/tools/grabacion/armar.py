# Turns the time-dilated captures (frames/*.jpg + frames.json) into assets/video/app.mp4 at real speed, 30 fps.
# App time of each frame = (wall time - t0) / scale; ffmpeg's concat demuxer holds each frame until the next one.
import json, os, subprocess
D = os.path.dirname(os.path.abspath(__file__))
F = json.load(open(os.path.join(D, 'frames.json')))
t0, sc, ts = F['t0'], F['scale'], F['frames']
app = [(t - t0) / sc for t in ts]
lst = os.path.join(D, 'frames.txt')
with open(lst, 'w') as f:
    for i in range(len(app)):
        d = (app[i + 1] - app[i]) if i + 1 < len(app) else 0.5
        f.write(f"file 'frames/{i:05d}.jpg'\nduration {max(d, 0.001):.4f}\n")
    f.write(f"file 'frames/{len(app) - 1:05d}.jpg'\n")
out = os.path.join(D, '..', '..', 'assets', 'video', 'app.mp4')
os.makedirs(os.path.dirname(out), exist_ok=True)
# the first frame starts at app time app[0]; pad the start by holding it
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-vf', f'tpad=start_duration={app[0]:.3f}:start_mode=clone,fps=30,scale=1014:1726,format=yuv420p',
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', out], check=True, cwd=D)
print('frames', len(ts), 'app seconds', round(app[-1], 2), 'fps captured', round(len(ts) / app[-1], 1))
