import json, time, sys, numpy as np, coremltools as ct
from PIL import Image
from truth import load, summary
all_cases = load("../../..")
ml=ct.models.MLModel(sys.argv[1], compute_units=ct.ComputeUnit.ALL)
L=json.load(open("../ios/Resources/garment-labels.json"))
rows=[(l["group"], l["value"], np.array(l["embeddings"])) for l in L["labels"]]
def prep(p):
    im=Image.open(p).convert("RGBA"); bg=Image.new("RGBA",im.size,"white"); bg.alpha_composite(im); im=bg.convert("RGB")
    w,h=im.size; s=max(w,h); sq=Image.new("RGB",(s,s),"white"); sq.paste(im,((s-w)//2,(s-h)//2))
    return sq.resize((224,224), Image.BILINEAR)
results=[]; ts=[]
for path,truth,style,group in all_cases:
    t=time.time(); f=ml.predict({"image":prep(path)})["embedding"][0]; ts.append(time.time()-t)
    scores={"kind":{},"style":{}}
    for g,v,E in rows: scores[g][v]=float((E@f).max())
    results.append((path,truth,style,group,scores))
print(sys.argv[1], f"median {np.median(ts)*1000:.1f} ms")
summary(results)
