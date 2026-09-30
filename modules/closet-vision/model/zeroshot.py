import sys, time, torch
from PIL import Image
from transformers import AutoModel, AutoProcessor
from labels import KINDS
from truth import cases
name = sys.argv[1]
model = AutoModel.from_pretrained(name).eval()
proc = AutoProcessor.from_pretrained(name)
siglip = "siglip" in name
prompts, owners = [], []
for kind, (cat, texts) in KINDS.items():
    for t in texts:
        prompts.append(f"a photo of {t}." if not siglip else f"This is a photo of {t}.")
        owners.append(kind)
with torch.no_grad():
    ti = proc(text=prompts, return_tensors="pt", padding="max_length" if siglip else True, max_length=64 if siglip else None, truncation=True)
    tf = model.get_text_features(**ti)
    tf = getattr(tf, "pooler_output", tf); tf = tf / tf.norm(dim=-1, keepdim=True)
def white(img):
    img = img.convert("RGBA"); bg = Image.new("RGBA", img.size, "white"); bg.alpha_composite(img); return bg.convert("RGB")
res = {"sample": [0,0,0,0], "web": [0,0,0,0]}
wrong = []
t0 = time.time()
for path, truth, group in cases(sys.argv[2]):
    img = white(Image.open(path))
    with torch.no_grad():
        f = model.get_image_features(**proc(images=img, return_tensors="pt"))
        f = getattr(f, "pooler_output", f); f = f / f.norm(dim=-1, keepdim=True)
    sims = (f @ tf.T)[0]
    best = {}
    for s, k in zip(sims.tolist(), owners): best[k] = max(best.get(k, -9), s)
    ranked = sorted(best, key=best.get, reverse=True)
    kind = ranked[0]; cat = KINDS[kind][0]
    r = res[group]; r[0] += 1; r[1] += kind == truth; r[2] += cat == KINDS[truth][0]; r[3] += truth in ranked[:3]
    if kind != truth: wrong.append(f"{path.split('/')[-1]}: {truth} -> {kind} ({ranked[1]})")
print(name, f"{(time.time()-t0)/len(cases(sys.argv[2]))*1000:.0f} ms/img cpu")
for g, (n, k, c, t3) in res.items(): print(f"  {g}: n={n} kind={k}/{n} category={c}/{n} top3={t3}/{n}")
for w in wrong: print("   ", w)
