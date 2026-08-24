import av, sys, os
SRC=sys.argv[1]; OUT=sys.argv[2]; step=float(sys.argv[3]); 
t0=float(sys.argv[4]) if len(sys.argv)>4 else 0.0
t1=float(sys.argv[5]) if len(sys.argv)>5 else 1e9
os.makedirs(OUT, exist_ok=True)
c=av.open(SRC); s=c.streams.video[0]; s.thread_type="AUTO"
nt=t0; last=0
for f in c.decode(s):
    t=float(f.pts*s.time_base); last=t
    if t<t0: continue
    if t>t1: break
    if t+1e-6>=nt:
        f.to_image().save(f"{OUT}/f_{t:07.3f}.jpg", quality=90); nt+=step
print("dur~",last, "size", s.codec_context.width, s.codec_context.height)
