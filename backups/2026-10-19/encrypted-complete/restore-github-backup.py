import pathlib,json,hashlib,argparse
ap=argparse.ArgumentParser(description='Reassemble verified encrypted GitHub backup chunks. No live website changes.')
ap.add_argument('--directory',default=str(pathlib.Path(__file__).resolve().parent));ap.add_argument('--output',default='reconstructed-encrypted-backup');a=ap.parse_args()
p=pathlib.Path(a.directory);out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
m=json.loads((p/'github-chunks-manifest.json').read_text());e=json.loads((p/'encrypted-manifest.json').read_text());expected={v['name']:v for archive in e['archives'] for v in archive['parts']}
for source in sorted(set(x['source'] for x in m['chunks'])):
 rows=sorted((x for x in m['chunks'] if x['source']==source),key=lambda x:x['offset']);target=out/source
 with target.open('wb') as f:
  for row in rows:
   b=(p/m['directory']/row['path']).read_bytes()
   assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'],'Chunk mismatch '+row['path']
   assert f.tell()==row['offset'],'Chunk order mismatch'
   f.write(b)
 assert target.stat().st_size==expected[source]['bytes']
 assert hashlib.sha256(target.read_bytes()).hexdigest()==expected[source]['sha256'],'Part mismatch '+source
 print('Verified:',source)
(out/'encrypted-manifest.json').write_text(json.dumps(e,indent=2))
print('All seven encrypted parts reconstructed. Decrypt separately using the private recovery key.')
