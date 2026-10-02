import json

import numpy as np
import torch
import torch.nn.functional as F
from sklearn.metrics import roc_auc_score

from common import DATA, PAIRS, TYPES, from_int8

TABLE = torch.zeros(len(TYPES), len(TYPES), dtype=torch.long)
for number, (first, second) in enumerate(PAIRS):
    TABLE[TYPES.index(first), TYPES.index(second)] = number
    TABLE[TYPES.index(second), TYPES.index(first)] = number


class Head(torch.nn.Module):
    def __init__(self, dim):
        super().__init__()
        self.projection = torch.nn.Linear(768, dim, bias=False)
        self.masks = torch.nn.Parameter(torch.ones(len(PAIRS), dim))

    def forward(self, a, b, ta, tb):
        mask = self.masks[TABLE.to(a.device)[ta, tb]]
        first = F.normalize(self.projection(a) * mask, dim=-1)
        second = F.normalize(self.projection(b) * mask, dim=-1)
        return (first * second).sum(-1)


def load_items():
    meta = json.load(open(DATA / "items.json"))
    vectors = torch.from_numpy(from_int8(np.load(DATA / "items.npy")))
    types = torch.tensor([TYPES.index(name) for name in meta["types"]])
    return {item: number for number, item in enumerate(meta["ids"])}, vectors, types


def load_outfits(split, part, index):
    data = json.load(open(DATA / "outfits" / f"{split}_default" / f"{part}.json"))
    slots = {f"{outfit['set_id']}_{item['index']}": index.get(item["item_id"]) for outfit in data for item in outfit["items"]}
    outfits = [
        [index[item["item_id"]] for item in outfit["items"]]
        for outfit in data
        if all(item["item_id"] in index for item in outfit["items"])
    ]
    return outfits, slots


@torch.no_grad()
def outfit_scores(head, outfits, vectors, types, device):
    first, second, owner = [], [], []
    for number, outfit in enumerate(outfits):
        for i in range(len(outfit)):
            for j in range(i + 1, len(outfit)):
                first.append(outfit[i])
                second.append(outfit[j])
                owner.append(number)
    first = torch.tensor(first)
    second = torch.tensor(second)
    parts = []
    for start in range(0, len(first), 65536):
        a = first[start : start + 65536]
        b = second[start : start + 65536]
        parts.append(head(vectors[a].to(device), vectors[b].to(device), types[a].to(device), types[b].to(device)).cpu())
    similarities = torch.cat(parts).numpy().astype(np.float64)
    totals = np.bincount(owner, weights=similarities, minlength=len(outfits))
    counts = np.bincount(owner, minlength=len(outfits))
    return totals / np.maximum(counts, 1)


def questions(split, part, task):
    rows = json.load(open(DATA / "outfits" / f"{split}_{task}" / f"{part}.json"))
    return [{**row, "items": [slot for slot in row["items"] if slot]} for row in rows]


def compatibility_auc(head, split, part, slots, vectors, types, device):
    rows = [row for row in questions(split, part, "compatibility") if all(slots.get(slot) is not None for slot in row["items"])]
    scores = outfit_scores(head, [[slots[slot] for slot in row["items"]] for row in rows], vectors, types, device)
    return float(roc_auc_score([int(row["label"]) for row in rows], scores)), len(rows)


def fill_in_blank(head, split, part, slots, vectors, types, device):
    rows = [
        row
        for row in questions(split, part, "fill_in_the_blank")
        if all(slots.get(slot) is not None for slot in row["items"] + row["candidates"])
    ]
    outfits = [[slots[slot] for slot in row["items"]] + [slots[candidate]] for row in rows for candidate in row["candidates"]]
    scores = outfit_scores(head, outfits, vectors, types, device).reshape(len(rows), 4)
    labels = np.array([row["label"] for row in rows])
    right = scores[np.arange(len(rows)), labels]
    others = np.where(np.arange(4)[None, :] == labels[:, None], -np.inf, scores).max(axis=1)
    return float((right > others).mean()), len(rows)
