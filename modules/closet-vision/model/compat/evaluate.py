import json

import torch

from common import OUT, device
from head import Head, compatibility_auc, fill_in_blank, load_items, load_outfits

run = device()
index, vectors, types = load_items()
results = {}
for split in ["nondisjoint", "disjoint"]:
    saved = torch.load(OUT / f"head-{split}.pt")
    head = Head(saved["dim"]).to(run)
    head.load_state_dict(saved["state"])
    head.eval()
    _, slots = load_outfits(split, "test", index)
    auc, compatibility_count = compatibility_auc(head, split, "test", slots, vectors, types, run)
    fitb, fitb_count = fill_in_blank(head, split, "test", slots, vectors, types, run)
    results[split] = {
        "dim": saved["dim"],
        "auc": round(auc, 4),
        "fitb": round(fitb, 4),
        "compatibilityQuestions": compatibility_count,
        "fitbQuestions": fitb_count,
    }
    print(split, results[split])
json.dump(results, open(OUT / "metrics.json", "w"), indent=2)
