import sys, os, glob
from PIL import Image, ImageDraw
src_dir, out, cols, rows, tile_w = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
start = int(sys.argv[6]) if len(sys.argv)>6 else 0
files = sorted(glob.glob(os.path.join(src_dir,"*.jpg")))[start:start+cols*rows]
if not files: sys.exit("no files")
im0 = Image.open(files[0]); ar = im0.height/im0.width
tw, th = tile_w, int(tile_w*ar)
sheet = Image.new("RGB", (cols*tw, rows*(th+16)), "black")
d = ImageDraw.Draw(sheet)
for i,f in enumerate(files):
    im = Image.open(f).resize((tw,th))
    x=(i%cols)*tw; y=(i//cols)*(th+16)
    sheet.paste(im,(x,y+16))
    d.text((x+4,3), os.path.basename(f)[2:-4], fill="yellow")
sheet.save(out, quality=88)
print(out, sheet.size, len(files))
