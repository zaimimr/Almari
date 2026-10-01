import sys

import coremltools as ct
import numpy as np
import torch
from coremltools.optimize.coreml import (
    OpLinearQuantizerConfig,
    OptimizationConfig,
    linear_quantize_weights,
)
from transformers import AutoModelForSemanticSegmentation

from parserclasses import CLASSES, MEAN, NAME, SIDE, STD

model = AutoModelForSemanticSegmentation.from_pretrained(NAME).eval()
found = [model.config.id2label[index] for index in range(len(model.config.id2label))]
if found != CLASSES:
    sys.exit(f"class list changed: {found}")


class Parser(torch.nn.Module):
    def __init__(self, inner):
        super().__init__()
        self.inner = inner
        self.register_buffer("mean", torch.tensor(MEAN).view(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor(STD).view(1, 3, 1, 1))

    def forward(self, image):
        logits = self.inner(pixel_values=(image - self.mean) / self.std, return_dict=False)[0]
        return torch.nn.functional.interpolate(
            logits, size=(SIDE, SIDE), mode="bilinear", align_corners=False
        )


parser = Parser(model).eval()
traced = torch.jit.trace(parser, torch.rand(1, 3, SIDE, SIDE))
converted = ct.convert(
    traced,
    inputs=[
        ct.ImageType(
            name="image",
            shape=(1, 3, SIDE, SIDE),
            scale=1 / 255,
            color_layout=ct.colorlayout.RGB,
        )
    ],
    outputs=[ct.TensorType(name="logits", dtype=np.float32)],
    minimum_deployment_target=ct.target.iOS18,
    compute_precision=ct.precision.FLOAT16,
)
quantized = linear_quantize_weights(
    converted,
    OptimizationConfig(
        global_config=OpLinearQuantizerConfig(mode="linear_symmetric", dtype="int8")
    ),
)
quantized.short_description = "Clothes parser, 18 ATR classes, 512 by 512"
quantized.save("ClothesParser.mlpackage")
print("saved ClothesParser.mlpackage")
