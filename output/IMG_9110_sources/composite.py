import sys, subprocess, numpy as np, os
from PIL import Image
src, ovdir, out, off, dur = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
FPS=30; Wd,Ht=1080,1920; N=round(dur*FPS); CX,CY=540,1100
def ease(x): x=min(1,max(0,x)); return 1-(1-x)**3
def zoom(t):  # virtual camera keyframes (output time)
    if t<7.11:  return 1.0+0.04*(t/7.11)
    if t<13.39: return 1.10-0.02*ease((t-7.11)/0.6)
    if t<16.39: return 1.0+0.03*((t-13.39)/3.0)
    return 1.085-0.01*ease((t-16.39)/0.5)
dec=subprocess.Popen(['ffmpeg','-v','error','-ss',str(off),'-i',src,'-t',str(dur),'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{Wd}x{Ht}','-r',str(FPS),'-i','-',
  '-vf','eq=contrast=1.04:saturation=1.06:gamma=0.98,colorbalance=rs=0.02:gs=0.0:bs=-0.03:rh=0.015:bh=-0.02,vignette=angle=0.35,noise=alls=3:allf=t',
  '-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
for i in range(N):
    buf=dec.stdout.read(Wd*Ht*3)
    if len(buf)<Wd*Ht*3: break
    im=Image.frombuffer('RGB',(Wd,Ht),buf)
    z=zoom(i/FPS); w,h=Wd/z,Ht/z; x0=CX-(CX)/z; y0=CY-(CY)/z
    im=im.resize((Wd,Ht),Image.BICUBIC,box=(x0,y0,x0+w,y0+h))
    ov=os.path.join(ovdir,f'{i:04d}.png')
    if os.path.exists(ov):
        o=Image.open(ov).convert('RGBA'); im=im.convert('RGBA'); im.alpha_composite(o); im=im.convert('RGB')
    enc.stdin.write(im.tobytes())
enc.stdin.close(); enc.wait(); dec.terminate(); print('frames',i+1)
