import torch, numpy as np, coremltools as ct, json
from coremltools.converters.mil.frontend.torch import ops as _ops
from coremltools.converters.mil import Builder as _mb
_orig=_ops._cast
def _cast(context, node, dtype, dtype_name):
    x=context[node.inputs[0]] if not isinstance(node.inputs[0], str) else context[node.inputs[0]]
    if x.val is not None and getattr(x.val, "shape", ()) != () and np.size(x.val) == 1:
        context.add(_mb.const(val=dtype(np.asarray(x.val).item()), name=node.name)); return
    return _orig(context, node, dtype, dtype_name)
_ops._cast=_cast
from transformers import AutoModel, AutoProcessor
from labels import KINDS, STYLES, ATTRIBUTES
name="google/siglip2-base-patch16-224"
model=AutoModel.from_pretrained(name).eval(); proc=AutoProcessor.from_pretrained(name)
class Vision(torch.nn.Module):
    def __init__(s, m): super().__init__(); s.v=m.vision_model
    def forward(s, x):
        f=s.v(pixel_values=x).pooler_output
        return f/f.norm(dim=-1, keepdim=True)
v=Vision(model).eval()
ex=torch.rand(1,3,224,224)*2-1
traced=torch.jit.trace(v, ex)
ml=ct.convert(traced, inputs=[ct.ImageType(name="image", shape=(1,3,224,224), scale=1/127.5, bias=[-1,-1,-1], color_layout=ct.colorlayout.RGB)],
  outputs=[ct.TensorType(name="embedding")], minimum_deployment_target=ct.target.iOS18, compute_precision=ct.precision.FLOAT16)
from coremltools.optimize.coreml import OpLinearQuantizerConfig, OptimizationConfig, linear_quantize_weights
ml8=linear_quantize_weights(ml, OptimizationConfig(global_config=OpLinearQuantizerConfig(mode="linear_symmetric", dtype="int8")))
ml8.save("GarmentEncoder.mlpackage")
groups=[("kind", kind, texts) for kind,(_,_,texts) in KINDS.items()]+[("style", style, texts) for style,texts in STYLES.items()]+[(group, value, texts) for group,values in ATTRIBUTES.items() for value,texts in values.items()]
prompts=[f"This is a photo of {t}." for _,_,texts in groups for t in texts]
with torch.no_grad():
    ti=proc(text=prompts, return_tensors="pt", padding="max_length", max_length=64, truncation=True)
    tf=model.get_text_features(**ti); tf=getattr(tf,"pooler_output",tf); tf=tf/tf.norm(dim=-1,keepdim=True)
rows=iter(tf.tolist())
labels=[{"group":g,"value":v,"embeddings":[[round(x,5) for x in next(rows)] for _ in texts]} for g,v,texts in groups]
json.dump({"model":name,"version":2,"labels":labels}, open("../ios/Resources/garment-labels.json","w"), separators=(",",":"))
print("labels:", len([l for l in labels if l["group"]=="kind"]), "kinds,", len([l for l in labels if l["group"]=="style"]), "styles")
img=proc(images=__import__("PIL.Image",fromlist=["x"]).open("../../../assets/wardrobe/navy-blazer.png").convert("RGB"),return_tensors="pt")
with torch.no_grad(): ref=v(img["pixel_values"])[0].numpy()
from PIL import Image
pil=Image.open("../../../assets/wardrobe/navy-blazer.png").convert("RGB").resize((224,224), Image.BICUBIC)
out=ml8.predict({"image":pil})["embedding"][0]
print("cosine torch vs coreml int8:", float(np.dot(ref,out)/np.linalg.norm(out)))
