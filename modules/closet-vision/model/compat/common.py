import base64
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from transformers import AutoModel

NAME = "google/siglip2-base-patch16-224"
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DATA = HERE / "data"
OUT = HERE / "out"
TYPES = ["main", "bottom", "outer", "shoes", "bag", "scarf", "accessory"]
PAIRS = [(a, b) for i, a in enumerate(TYPES) for b in TYPES[i:]]
POLYVORE_TYPES = {
    "tops": "main",
    "all-body": "main",
    "bottoms": "bottom",
    "outerwear": "outer",
    "shoes": "shoes",
    "bags": "bag",
    "scarves": "scarf",
    "jewellery": "accessory",
    "accessories": "accessory",
    "hats": "accessory",
    "sunglasses": "accessory",
}


def device():
    return torch.device("mps" if torch.backends.mps.is_available() else "cpu")


def prep(image):
    image = image.convert("RGBA")
    background = Image.new("RGBA", image.size, "white")
    background.alpha_composite(image)
    image = background.convert("RGB")
    width, height = image.size
    side = max(width, height)
    square = Image.new("RGB", (side, side), "white")
    square.paste(image, ((side - width) // 2, (side - height) // 2))
    return square.resize((224, 224), Image.BILINEAR)


def to_int8(features):
    peak = np.abs(features).max(axis=-1, keepdims=True)
    return np.clip(np.rint(features / np.maximum(peak, 1e-12) * 127), -127, 127).astype(np.int8)


def from_int8(values):
    features = values.astype(np.float32)
    return features / np.maximum(np.linalg.norm(features, axis=-1, keepdims=True), 1e-12)


def to_base64(values):
    return base64.b64encode(values.astype(np.int8).tobytes()).decode()


class Encoder:
    def __init__(self):
        self.device = device()
        self.model = AutoModel.from_pretrained(NAME).vision_model.eval().to(self.device)

    @torch.no_grad()
    def __call__(self, images):
        pixels = np.stack([np.asarray(prep(image), dtype=np.float32) for image in images]) / 127.5 - 1
        batch = torch.from_numpy(pixels).permute(0, 3, 1, 2).to(self.device)
        features = self.model(pixel_values=batch).pooler_output
        features = features / features.norm(dim=-1, keepdim=True)
        return to_int8(features.cpu().numpy())
