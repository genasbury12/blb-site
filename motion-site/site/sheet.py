import sys,glob
from PIL import Image
d,W,n=sys.argv[1],sys.argv[2],int(sys.argv[3])
fs=sorted(glob.glob(f'{d}/s{W}_*.png'))
for k in range(0,len(fs),n):
    ims=[Image.open(f) for f in fs[k:k+n]];w,h=ims[0].size;sc=0.5 if int(W)>500 else 0.6
    cols=3 if int(W)>500 else n
    rows=(len(ims)+cols-1)//cols
    S=Image.new('RGB',(int(w*sc)*cols,int(h*sc)*rows),'white')
    for i,im in enumerate(ims): S.paste(im.resize((int(w*sc),int(h*sc))),((i%cols)*int(w*sc),(i//cols)*int(h*sc)))
    S.save(f'{d}/sheet{W}_{k//n:02d}.png')
print(len(fs))
