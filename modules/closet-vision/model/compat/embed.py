import io
import json
import time

import numpy as np
import pyarrow.parquet as pq
from PIL import Image

from common import DATA, POLYVORE_TYPES, Encoder

encoder = Encoder()
ids, types, chunks = [], [], []
started = time.time()
for path in sorted((DATA / "items" / "data").glob("*.parquet")):
    for table in pq.ParquetFile(path).iter_batches(batch_size=64, columns=["item_id", "image", "category"]):
        rows = table.to_pylist()
        chunks.append(encoder([Image.open(io.BytesIO(row["image"])) for row in rows]))
        ids += [row["item_id"] for row in rows]
        types += [POLYVORE_TYPES[row["category"]] for row in rows]
    print(path.name, len(ids), f"{time.time() - started:.0f} s", flush=True)
np.save(DATA / "items.npy", np.concatenate(chunks))
json.dump({"ids": ids, "types": types}, open(DATA / "items.json", "w"))
known = set(ids)
for split in ["nondisjoint", "disjoint"]:
    for part in ["train", "valid", "test"]:
        outfits = json.load(open(DATA / "outfits" / f"{split}_default" / f"{part}.json"))
        needed = {item["item_id"] for outfit in outfits for item in outfit["items"]}
        print(split, part, "items", len(needed), "missing", len(needed - known))
print("items", len(ids), "types", {name: types.count(name) for name in sorted(set(types))})
