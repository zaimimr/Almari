import json

from PIL import Image

from common import ROOT, Encoder, to_base64

paths = sorted((ROOT / "assets" / "wardrobe").glob("*.png"))
vectors = Encoder()([Image.open(path) for path in paths])
target = ROOT / "src" / "domain" / "scoring" / "sample-embeddings.json"
with open(target, "w") as file:
    json.dump({path.stem: to_base64(vector) for path, vector in zip(paths, vectors)}, file, indent=2)
    file.write("\n")
print(target, len(paths), "samples")
