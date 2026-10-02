from huggingface_hub import snapshot_download

from common import DATA

outfits = snapshot_download(
    "owj0421/polyvore-outfits",
    repo_type="dataset",
    revision="5aabda5174c244792a97f0cab6b6f14c60c8d1b9",
    local_dir=DATA / "outfits",
    allow_patterns=["*_default/*", "*_compatibility/*", "*_fill_in_the_blank/*", "README.md", "LICENSE"],
)
items = snapshot_download(
    "owj0421/polyvore",
    repo_type="dataset",
    revision="8d3809239c7b235db712559b590a6342af1679fd",
    local_dir=DATA / "items",
    allow_patterns=["data/*.parquet", "README.md"],
)
for path in sorted(DATA.rglob("*.json")) + sorted(DATA.rglob("*.parquet")):
    print(path.relative_to(DATA), f"{path.stat().st_size / 1e6:.1f} MB")
