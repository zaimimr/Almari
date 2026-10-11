import hashlib
import json
import subprocess
import urllib.request
from pathlib import Path


root = Path(__file__).resolve().parent
source = json.loads((root / "segmenter-source.json").read_text())
resources = root.parent / "ios" / "Resources"

for model, files in source["files"].items():
    package = root / f"{model}.mlpackage"
    for name, expected in files.items():
        destination = package / name
        if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest() == expected:
            continue
        url = f"https://huggingface.co/{source['repository']}/resolve/{source['revision']}/{package.name}/{name}"
        with urllib.request.urlopen(url, timeout=120) as response:
            data = response.read()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f"Model file hash does not match: {model}/{name}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
    subprocess.run(["xcrun", "coremlcompiler", "compile", str(package), str(resources)], check=True)
