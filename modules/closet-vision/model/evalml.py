import json, time, numpy as np, coremltools as ct, sys
from PIL import Image
from truth import cases
from labels import KINDS
ml=ct.models.MLModel(sys.argv[1], compute_units=ct.ComputeUnit.ALL)
L=json.load(open("garment-labels.json")); E=np.array([l["embedding"] for l in L["labels"]]); kinds=[l["kind"] for l in L["labels"]]
def prep(p):
    im=Image.open(p).convert("RGBA"); bg=Image.new("RGBA",im.size,"white"); bg.alpha_composite(im); im=bg.convert("RGB")
    w,h=im.size; s=max(w,h); sq=Image.new("RGB",(s,s),"white"); sq.paste(im,((s-w)//2,(s-h)//2))
    return sq.resize((224,224), Image.BILINEAR)
ok=cat=0; n=0; ts=[]; margins=[]
for path,truth,g in cases("../../.."):
    t=time.time(); f=ml.predict({"image":prep(path)})["embedding"][0]; ts.append(time.time()-t)
    s=E@f; best={}
    for v,k in zip(s,kinds): best[k]=max(best.get(k,-9),v)
    r=sorted(best,key=best.get,reverse=True); n+=1; ok+=r[0]==truth; cat+=KINDS[r[0]][0]==KINDS[truth][0]
    margins.append((best[r[0]]-best[r[1]], r[0]==truth, path.split('/')[-1], truth, r[0]))
    if r[0]!=truth: print("  wrong", path.split('/')[-1], truth,"->",r[0])
print(sys.argv[1], f"kind {ok}/{n} category {cat}/{n} median {np.median(ts)*1000:.1f} ms")
for m in sorted(margins)[:8]: print("  low margin %.4f"%m[0], m[1:])
