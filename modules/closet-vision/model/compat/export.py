import base64
import json

import numpy as np
import torch

from common import NAME, OUT, PAIRS, ROOT, TYPES, from_int8
from head import Head

saved = torch.load(OUT / "head-nondisjoint.pt")
projection = saved["state"]["projection.weight"].cpu().numpy().astype(np.float64).round(5)
masks = saved["state"]["masks"].cpu().numpy().astype(np.float64).round(5)
samples = json.load(open(ROOT / "src" / "domain" / "scoring" / "sample-embeddings.json"))
checks = [
    (["ivory-tunic", "ivory-trousers", "chocolate-loafers", "mauve-hijab"], ["main", "bottom", "shoes", "scarf"]),
    (["sage-kurta", "ivory-salwar", "chocolate-loafers", "ivory-hijab"], ["main", "bottom", "shoes", "scarf"]),
    (["olive-maxi-dress", "navy-blazer", "chocolate-loafers", "taupe-bag"], ["main", "outer", "shoes", "bag"]),
]


def decode(text):
    values = np.frombuffer(base64.b64decode(text), dtype=np.int8).astype(np.float64)
    return values / np.linalg.norm(values)


def score(names, kinds):
    features = [projection @ decode(samples[name]) for name in names]
    total = []
    for i in range(len(features)):
        for j in range(i + 1, len(features)):
            first, second = sorted([kinds[i], kinds[j]], key=TYPES.index)
            mask = masks[PAIRS.index((first, second))]
            x = features[i] * mask
            y = features[j] * mask
            total.append(float(x @ y / np.sqrt((x @ x) * (y @ y))))
    return sum(total) / len(total)


head = Head(saved["dim"])
head.load_state_dict(saved["state"])
head.eval()
with torch.no_grad():
    for names, kinds in checks:
        vectors = torch.from_numpy(from_int8(np.stack([np.frombuffer(base64.b64decode(samples[name]), dtype=np.int8) for name in names])))
        kind = torch.tensor([TYPES.index(name) for name in kinds])
        pairs = [(i, j) for i in range(len(names)) for j in range(i + 1, len(names))]
        a = torch.tensor([i for i, _ in pairs])
        b = torch.tensor([j for _, j in pairs])
        reference = float(head(vectors[a], vectors[b], kind[a], kind[b]).mean())
        assert abs(reference - score(names, kinds)) < 1e-3, (names, reference, score(names, kinds))
metrics = json.load(open(OUT / "metrics.json"))
exported = {
    "version": 1,
    "model": NAME,
    "dataset": "Polyvore Outfits, nondisjoint split",
    "dim": int(projection.shape[0]),
    "types": TYPES,
    "metrics": {split: {"auc": value["auc"], "fitb": value["fitb"]} for split, value in metrics.items()},
    "checks": [
        {"embeddings": [samples[name] for name in names], "types": kinds, "score": round(score(names, kinds), 8)}
        for names, kinds in checks
    ],
    "projection": projection.tolist(),
    "masks": {f"{first}|{second}": masks[number].tolist() for number, (first, second) in enumerate(PAIRS)},
}
path = ROOT / "src" / "domain" / "scoring" / "compat-head.json"
with open(path, "w") as file:
    json.dump(exported, file, separators=(",", ":"))
    file.write("\n")
print(path, f"{path.stat().st_size / 1024:.0f} KB", "parameters", projection.size + masks.size)
for check in exported["checks"]:
    print(check["types"], check["score"])
