"""Join the backup parts from a local clone; verify every part and full ZIP."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
manifest = json.loads((root / 'archive-parts.json').read_text())
destination = root / manifest['archive']
if destination.exists():
    raise SystemExit('Destination already exists; choose another directory first.')
try:
    with destination.open('xb') as output:
        for part in manifest['parts']:
            data = (root / Path(part['path']).name).read_bytes()
            if len(data) != part['length'] or hashlib.sha256(data).hexdigest() != part['sha256']:
                raise ValueError('Part integrity check failed: ' + part['path'])
            output.write(data)
    if hashlib.sha256(destination.read_bytes()).hexdigest() != manifest['sha256']:
        raise ValueError('Archive integrity check failed')
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP integrity check failed')
    print('Verified archive:', destination)
except Exception:
    destination.unlink(missing_ok=True)
    raise
