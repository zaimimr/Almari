import sys
from pathlib import Path

import coremltools as ct
import numpy as np
import torch
from PIL import Image
from transformers import AutoModelForSemanticSegmentation

from parserclasses import CLASSES, MEAN, NAME, SIDE, STD

package = Path("ClothesParser.mlpackage")
if not package.exists():
    sys.exit("FAIL ClothesParser.mlpackage is missing, run parser.py first")

failures = []
model = AutoModelForSemanticSegmentation.from_pretrained(NAME).eval()
found = [model.config.id2label[index] for index in range(len(model.config.id2label))]
if found != CLASSES:
    failures.append(f"model classes are {found}")

mean = np.array(MEAN, dtype=np.float32).reshape(3, 1, 1)
std = np.array(STD, dtype=np.float32).reshape(3, 1, 1)
coreml = ct.models.MLModel(str(package))
agreements = []
for path in sorted(Path("../../../assets/wardrobe").glob("*.png")):
    rgba = Image.open(path).convert("RGBA")
    white = Image.new("RGBA", rgba.size, "white")
    white.alpha_composite(rgba)
    picture = white.convert("RGB").resize((SIDE, SIDE), Image.BILINEAR)
    pixels = np.asarray(picture, dtype=np.float32).transpose(2, 0, 1) / 255
    with torch.no_grad():
        logits = model(pixel_values=torch.from_numpy((pixels - mean) / std)[None]).logits
        upsampled = torch.nn.functional.interpolate(
            logits, size=(SIDE, SIDE), mode="bilinear", align_corners=False
        )
    expected = upsampled.argmax(1)[0].numpy()
    output = coreml.predict({"image": picture})["logits"]
    if output.shape != (1, len(CLASSES), SIDE, SIDE):
        failures.append(f"{path.stem} output shape {output.shape}")
        continue
    agreement = float((output.argmax(1)[0] == expected).mean())
    agreements.append(agreement)
    seen = sorted({CLASSES[index] for index in np.unique(expected)} - {"Background"})
    print(f"{path.stem}: agreement {agreement:.3f}, classes {seen}")
    if agreement < 0.95:
        failures.append(f"{path.stem} agreement {agreement:.3f}")

size = sum(file.stat().st_size for file in package.rglob("*") if file.is_file()) / 1e6
print(f"package {size:.1f} MB, mean agreement {np.mean(agreements):.3f}")
if size > 40:
    failures.append(f"package is {size:.1f} MB")
if failures:
    for failure in failures:
        print("FAIL", failure)
    sys.exit(1)
print("PASS")
