import pathlib,json,hashlib,zipfile
p=pathlib.Path(__file__).parent
m=json.loads((p/'backup-manifest-20261019.json').read_text())
for item in m['drive_files']:
 f=p/item['name']
 assert f.exists(), 'Missing '+item['name']
 assert f.stat().st_size==item['bytes'], 'Size mismatch '+item['name']
 assert hashlib.sha256(f.read_bytes()).hexdigest()==item['sha256'], 'Hash mismatch '+item['name']
for name in sorted(set(x['archive'] for x in m['segments'])):
 with (p/name).open('wb') as out:
  for part in sorted((x for x in m['segments'] if x['archive']==name),key=lambda x:x['name']):
   out.write((p/part['name']).read_bytes())
for item in m['archives']:
 f=p/item['name']
 assert hashlib.sha256(f.read_bytes()).hexdigest()==item['sha256']
 with zipfile.ZipFile(f) as z: assert z.testzip() is None
print('All hashes and ZIP CRC checks passed. No live-site changes made.')
