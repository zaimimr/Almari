import sys, time, torch
from PIL import Image
from transformers import AutoModel, AutoProcessor
from labels import KINDS, STYLES
from truth import load, summary
name = sys.argv[1]
all_cases = load(sys.argv[2])
model = AutoModel.from_pretrained(name).eval()
proc = AutoProcessor.from_pretrained(name)
siglip = "siglip" in name
owners = [("kind", k, t) for k, (_, _, texts) in KINDS.items() for t in texts] + [("style", s, t) for s, texts in STYLES.items() for t in texts]
prompts = [f"This is a photo of {t}." if siglip else f"a photo of {t}." for _, _, t in owners]
with torch.no_grad():
    ti = proc(text=prompts, return_tensors="pt", padding="max_length" if siglip else True, max_length=64 if siglip else None, truncation=True)
    tf = model.get_text_features(**ti)
    tf = getattr(tf, "pooler_output", tf); tf = tf / tf.norm(dim=-1, keepdim=True)
def white(img):
    img = img.convert("RGBA"); bg = Image.new("RGBA", img.size, "white"); bg.alpha_composite(img); return bg.convert("RGB")
results = []
t0 = time.time()
for path, truth, style, group in all_cases:
    img = white(Image.open(path))
    with torch.no_grad():
        f = model.get_image_features(**proc(images=img, return_tensors="pt"))
        f = getattr(f, "pooler_output", f); f = f / f.norm(dim=-1, keepdim=True)
    scores = {"kind": {}, "style": {}}
    for s, (g, v, _) in zip((f @ tf.T)[0].tolist(), owners): scores[g][v] = max(scores[g].get(v, -9), s)
    results.append((path, truth, style, group, scores))
print(name, f"{(time.time()-t0)/len(all_cases)*1000:.0f} ms/img cpu")
summary(results)
