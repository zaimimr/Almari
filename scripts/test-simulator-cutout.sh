set -eu
python3 - "${DEVICE:-Closet Development}" <<'PY'
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def command(*arguments):
    return subprocess.check_output(arguments, text=True).strip()


def dimensions(image):
    return tuple(map(int, command('magick', 'identify', '-format', '%w %h', str(image)).split()))


def alpha(image, point, size):
    x, y = (int(value * side) for value, side in zip(point, size))
    if not 0 <= x < size[0] or not 0 <= y < size[1]:
        raise SystemExit('Crop landmark outside saved image')
    return float(command('magick', str(image), '-format', f'%[fx:p{{{x},{y}}}.a]', 'info:'))


def check():
    data = Path(command('xcrun', 'simctl', 'get_app_container', sys.argv[1], 'com.zaimimran.almari', 'data'))
    state = json.loads(command('sqlite3', '-readonly', str(data / 'Documents/SQLite/ExpoSQLiteStorage'),
                               "select value from storage where key = 'closet.v3'"))
    piece = next((item for item in state['pieces'] if item['id'] == 'seed-tunic'), None)
    if not piece or not piece.get('cutoutArea') or not piece.get('variants', {}).get('plain'):
        raise SystemExit('Missing saved tunic cutout')
    names = [piece['original'], piece['variants']['plain']]
    if any(Path(name).name != name or name in ['.', '..'] for name in names):
        raise SystemExit('Invalid cutout filename')
    source, cutout = [data / 'Documents/closet-photos' / name for name in names]
    digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    if digest(source) != digest(Path('assets/wardrobe/ivory-tunic.png')):
        raise SystemExit('Unexpected tunic source')
    original_size, cutout_size = dimensions(source), dimensions(cutout)
    area = piece['cutoutArea']
    keep = [[0.5, 0.5], [0.5, 0.65], [0.68, 0.5], [0.35, 0.7]]
    exclude = [[0.05, 0.05], [0.98, 0.5]]
    for point in keep + exclude:
        retained = point in keep
        if (alpha(source, point, original_size) > 0.5) != retained:
            raise SystemExit(f'Invalid source landmark: {point}')
        mapped = [(point[0] - area['x']) / area['width'], (point[1] - area['y']) / area['height']]
        if (alpha(cutout, mapped, cutout_size) > 0.5) != retained:
            raise SystemExit(f'Saved crop landmark failed: {point}')
        print(f'PASS saved crop landmark {point}')
    output = Path('planning/build/studio/crop-eval/simulator')
    output.mkdir(parents=True, exist_ok=True)
    record = {'sourceSha256': digest(source), 'cutoutSha256': digest(cutout), 'area': area,
              'keep': keep, 'exclude': exclude, 'inference': False}
    (output / 'tunic.json').write_text(json.dumps(record, indent=2) + '\n')
    print('6 saved simulator crop landmarks passed, no inference')


check()
PY
