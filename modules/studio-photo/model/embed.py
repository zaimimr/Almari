import json
from concurrent.futures import ThreadPoolExecutor
import struct
import sys
import urllib.request

import torch
from safetensors.torch import save_file
from transformers import AutoConfig, AutoModelForCausalLM, AutoTokenizer

base = "https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/resolve/e7b7dc27f91deacad38e78976d1f2b499d76a294/text_encoder/"
shards = ["model-00001-of-00002.safetensors", "model-00002-of-00002.safetensors"]
layers = 28
dtypes = {"BF16": torch.bfloat16, "F16": torch.float16, "F32": torch.float32}


def fetch(url, start, end):
    request = urllib.request.Request(url, headers={"Range": f"bytes={start}-{end - 1}"})
    return urllib.request.urlopen(request).read()


root, prompt, out = sys.argv[1], open(sys.argv[2]).read().strip(), sys.argv[3]
tokenizer = AutoTokenizer.from_pretrained(root + "/tokenizer")
config = AutoConfig.from_pretrained("black-forest-labs/FLUX.2-klein-4B", subfolder="text_encoder")
config.num_hidden_layers = layers
if getattr(config, "layer_types", None):
    config.layer_types = config.layer_types[:layers]
with torch.device("meta"):
    model = AutoModelForCausalLM.from_config(config, torch_dtype=torch.bfloat16)
params = dict(model.named_parameters())
loaded = set()
for shard in shards:
    url = base + shard
    size = struct.unpack("<Q", fetch(url, 0, 8))[0]
    header = json.loads(fetch(url, 8, 8 + size))
    jobs = [(key, info) for key, info in header.items() if key in params]
    with ThreadPoolExecutor(8) as pool:
        blobs = pool.map(lambda job: (job[0], job[1], bytearray(fetch(url, 8 + size + job[1]["data_offsets"][0], 8 + size + job[1]["data_offsets"][1]))), jobs)
    for key, info, raw in blobs:
        tensor = torch.frombuffer(raw, dtype=dtypes[info["dtype"]]).reshape(info["shape"]).to(torch.bfloat16)
        module_name, _, name = key.rpartition(".")
        setattr(model.get_submodule(module_name), name, torch.nn.Parameter(tensor, requires_grad=False))
        loaded.add(key)
missing = [key for key in params if key not in loaded and not key.startswith("lm_head")]
print("missing", missing, flush=True)
model.model.rotary_emb = type(model.model.rotary_emb)(config=config)
print([name for name, buffer in model.named_buffers() if buffer.is_meta], flush=True)
model.eval()
text = tokenizer.apply_chat_template(
    [{"role": "user", "content": prompt}],
    tokenize=False,
    add_generation_prompt=True,
    enable_thinking=False,
)
print(repr(text))
inputs = tokenizer(text, return_tensors="pt", padding="max_length", truncation=True, max_length=512)
print("valid tokens", int(inputs.attention_mask.sum()), "pad", tokenizer.pad_token_id)
with torch.no_grad():
    output = model.model(
        input_ids=inputs.input_ids,
        attention_mask=inputs.attention_mask,
        output_hidden_states=True,
        use_cache=False,
    )
stacked = torch.stack([output.hidden_states[k] for k in (9, 18, 27)], dim=1)
embeds = stacked.permute(0, 2, 1, 3).reshape(1, 512, 3 * stacked.shape[-1])[0]
print(embeds.shape, embeds.dtype, float(embeds.float().abs().max()))
save_file({"prompt": embeds.to(torch.bfloat16).contiguous()}, out)
