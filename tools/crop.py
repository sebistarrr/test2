import sys
from PIL import Image
f,out = sys.argv[1], sys.argv[2]
box = tuple(int(x) for x in sys.argv[3:7])
scale = float(sys.argv[7]) if len(sys.argv)>7 else 1.0
im = Image.open(f).crop(box)
if scale!=1.0: im=im.resize((int(im.width*scale), int(im.height*scale)), Image.LANCZOS)
im.save(out, quality=95); print(out, im.size)
