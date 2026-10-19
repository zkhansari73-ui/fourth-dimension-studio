import pathlib,json,hashlib,argparse
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
ap=argparse.ArgumentParser(description='Decrypt and verify the locally encrypted backup. Requires Python package cryptography.')
ap.add_argument('--key-file',required=True);ap.add_argument('--directory',default='.');ap.add_argument('--output',default='decrypted-backup');a=ap.parse_args()
p=pathlib.Path(a.directory);out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
m=json.loads((p/'encrypted-manifest.json').read_text());key=bytes.fromhex(pathlib.Path(a.key_file).read_text().strip())
for archive in m['archives']:
 chunks=[]
 for part in archive['parts']:
  b=(p/part['name']).read_bytes();assert len(b)==part['bytes'] and hashlib.sha256(b).hexdigest()==part['sha256'], 'Part mismatch: '+part['name'];chunks.append(b)
 sealed=b''.join(chunks);assert sealed[:12]==b'FD-AESGCM-1\n'
 raw=AESGCM(key).decrypt(sealed[12:24],sealed[24:],None)
 assert hashlib.sha256(raw).hexdigest()==archive['original_sha256']
 (out/archive['original']).write_bytes(raw);print('Verified:',archive['original'])
