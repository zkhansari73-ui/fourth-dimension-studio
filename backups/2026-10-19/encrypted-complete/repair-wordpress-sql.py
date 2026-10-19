"""Repair only the verified 20261019 SQL export; preserve the input file."""
import argparse, hashlib, re
from pathlib import Path
p = argparse.ArgumentParser()
p.add_argument('original', type=Path)
p.add_argument('corrected', type=Path)
a = p.parse_args()
raw = a.original.read_bytes()
assert hashlib.sha256(raw).hexdigest() == '45d6976c94ff53fcc7e4be1df4f56af3ab33fa53a2919861eb0a9ccad8fe0d1c', 'Unexpected input: stopping'
tokens = re.findall(rb'\{[a-f0-9]{64}\}', raw)
assert len(tokens) == 9914 and len(set(tokens)) == 1, 'Unexpected placeholders'
fixed = b'SET NAMES utf8mb4;\n' + raw.replace(tokens[0], b'%')
assert hashlib.sha256(fixed).hexdigest() == '0de673e66b1761574075c59e0fa580b7a32400fb38165848f01cc83a363e3092'
with a.corrected.open('xb') as out:
    out.write(fixed)
print('Verified corrected SQL written; original preserved.')
