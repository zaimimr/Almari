import random
import sys

import numpy as np
import torch
import torch.nn.functional as F

from common import OUT, device
from head import Head, compatibility_auc, fill_in_blank, load_items, load_outfits

split = sys.argv[1] if len(sys.argv) > 1 else "nondisjoint"
dim = int(sys.argv[2]) if len(sys.argv) > 2 else 64
random.seed(0)
np.random.seed(0)
torch.manual_seed(0)
run = device()
index, vectors, types = load_items()
train, _ = load_outfits(split, "train", index)
_, valid_slots = load_outfits(split, "valid", index)
item_types = types.numpy()
pool = np.array(sorted({item for outfit in train for item in outfit}))
by_type = {kind: pool[item_types[pool] == kind] for kind in np.unique(item_types[pool])}
pairs = np.array([(a, b) for outfit in train for a in outfit for b in outfit if a != b])
print(split, "dim", dim, "outfits", len(train), "pairs", len(pairs), "device", run, flush=True)
head = Head(dim).to(run)
optimizer = torch.optim.AdamW(head.parameters(), lr=1e-3, weight_decay=1e-4)
best = 0.0
OUT.mkdir(exist_ok=True)
for epoch in range(8):
    head.train()
    order = np.random.permutation(len(pairs))
    negatives = np.empty(len(pairs), dtype=np.int64)
    wanted = item_types[pairs[:, 1]]
    for kind, items in by_type.items():
        where = wanted == kind
        negatives[where] = items[np.random.randint(len(items), size=int(where.sum()))]
    total = 0.0
    for start in range(0, len(order), 2048):
        batch = order[start : start + 2048]
        a = torch.from_numpy(pairs[batch, 0])
        b = torch.from_numpy(pairs[batch, 1])
        n = torch.from_numpy(negatives[batch])
        ta = types[a].to(run)
        tb = types[b].to(run)
        anchor = vectors[a].to(run)
        positive = head(anchor, vectors[b].to(run), ta, tb)
        negative = head(anchor, vectors[n].to(run), ta, tb)
        loss = F.softplus(-10 * (positive - negative)).mean()
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        total += loss.item() * len(batch)
    head.eval()
    auc, _ = compatibility_auc(head, split, "valid", valid_slots, vectors, types, run)
    fitb, _ = fill_in_blank(head, split, "valid", valid_slots, vectors, types, run)
    print(f"epoch {epoch + 1} loss {total / len(order):.4f} valid auc {auc:.4f} fitb {fitb:.4f}", flush=True)
    if auc > best:
        best = auc
        torch.save({"dim": dim, "state": head.state_dict()}, OUT / f"head-{split}.pt")
print(f"best valid auc {best:.4f}")
