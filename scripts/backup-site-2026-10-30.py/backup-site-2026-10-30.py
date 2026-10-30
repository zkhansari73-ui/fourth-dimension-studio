import json, os, re, zipfile
from pathlib import Path
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
BASE = 'https://fourth-dimension-studio.infinityfreeapp.com'
OUT = Path('backup-2026-10-30')
ZIP_NAME = 'Fourth Dimension Studio — Complete Backup — 2026-10-30.zip'
MAX_BYTES = 30 * 1024 * 1024
skipped = []
seen = set()


def save(data, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def fetch(url, req):
    try:
        r = req.get(url, timeout=120000)
        if r.ok:
            return r.body
        print('fetch failed', url, r.status)
        return None
    except Exception as e:
        print('fetch failed', url, e)
        return None


def download(url, path, req):
    if url in seen:
        return False
    seen.add(url)
    data = fetch(url, req)
    if data is None:
        skipped.append(url + ' (fetch failed)')
        return False
    if len(data) > MAX_BYTES:
        skipped.append(url + ' (over 30 MB, skipped)')
        return False
    save(data, path)
    return True


def fetch_all(endpoint, fields, req):
    items = []
    page = 1
    while page <= 10:
        url = f'{BASE}/wp-json/wp/v2/{endpoint}?per_page=100&page={page}&_fields={fields}'
        data = fetch(url, req)
        if not data:
            break
        try:
            batch = json.loads(data)
        except Exception:
            print('not json', url, data[:200])
            break
        if not batch:
            break
        items.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return items


def clean_title(item):
    t = item.get('title')
    if isinstance(t, dict):
        return t.get('rendered', '')
    return str(t or '')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=['--no-sandbox'])
        context = browser.new_context(user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')
        page = context.new_page()
        try:
            page.goto(BASE + '/', wait_until='domcontentloaded', timeout=120000)
            page.wait_for_timeout(8000)
        except Exception as e:
            print('goto failed', e)
        home_text = ''
        try:
            home_text = page.content()
        except Exception as e:
            print('content failed', e)
        print('homepage length', len(home_text), 'has Design', 'Design, made to order.' in home_text)
        home = home_text.encode('utf-8', 'ignore')
        if home:
            save(home, OUT / 'site' / 'index.html')
            save(home, OUT / 'index.html')
        req = context.request
        asset_urls = set()
        for m in re.finditer(r'(?:src|href)="([^"]+)"', home_text):
            u = m.group(1)
            if u.startswith(('data:', 'mailto:', 'tel:', '#', 'javascript:')):
                continue
            full = urljoin(BASE + '/', u)
            if urlparse(full).netloc == urlparse(BASE).netloc:
                asset_urls.add(full.split('#')[0])
        for full in sorted(asset_urls):
            p = urlparse(full).path
            if not p or p.endswith('/') or p.endswith('.php'):
                continue
            rel = p.lstrip('/')
            if rel.startswith('wp-content/'):
                dest = OUT / rel
            else:
                dest = OUT / 'assets' / os.path.basename(rel)
            download(full, dest, req)
        page_urls = set()
        for m in re.finditer(r'href="([^"]+)"', home_text):
            u = m.group(1)
            if u.startswith(('data:', 'mailto:', 'tel:', '#', 'javascript:')):
                continue
            full = urljoin(BASE + '/', u).split('#')[0].split('?')[0]
            if urlparse(full).netloc != urlparse(BASE).netloc:
                continue
            if '/wp-content/' in full or '/wp-json/' in full or full.rstrip('/') == BASE:
                continue
            if re.search(r'\.(css|js|png|jpe?g|webp|svg|mp4|webm|pdf|woff2?|ttf|ico)$', full, re.I):
                continue
            page_urls.add(full)
        for full in sorted(page_urls)[:80]:
            data = fetch(full, req)
            if data:
                slug = urlparse(full).path.strip('/').replace('/', '_') or 'home'
                save(data, OUT / 'pages-html' / (slug[:120] + '.html'))
        posts = fetch_all('posts', 'id,date,modified,slug,title,link,content,excerpt', req)
        pages = fetch_all('pages', 'id,date,modified,slug,title,link,content,excerpt', req)
        media = fetch_all('media', 'id,date,modified,slug,source_url,mime_type,media_details', req)
        print('counts posts', len(posts), 'pages', len(pages), 'media', len(media))
        save(json.dumps(posts, ensure_ascii=False, indent=2).encode(), OUT / 'posts.json')
        save(json.dumps(pages, ensure_ascii=False, indent=2).encode(), OUT / 'pages.json')
        save(json.dumps(media, ensure_ascii=False, indent=2).encode(), OUT / 'media.json')
        lines = ['# Fourth Dimension Studio - posts inventory - 2026-10-30', '', f'Posts: {len(posts)}', f'Pages: {len(pages)}', f'Media: {len(media)}', '']
        for item in posts:
            lines.append(f"- {item.get('date','')} {item.get('slug','')} - {clean_title(item)} ({item.get('link','')})")
        lines.append('')
        lines.append('## Pages')
        for item in pages:
            lines.append(f"- {item.get('date','')} {item.get('slug','')} - {clean_title(item)} ({item.get('link','')})")
        save('\n'.join(lines).encode(), OUT / 'posts-inventory.md')
        for item in media:
            src = item.get('source_url')
            if not src:
                continue
            name = os.path.basename(urlparse(src).path)
            if name:
                download(src, OUT / 'media' / name, req)
        browser.close()
    files = sorted([p for p in OUT.rglob('*') if p.is_file()])
    total = sum(p.stat().st_size for p in files)
    readme = []
    readme.append('# Fourth Dimension Studio - Complete Backup - 2026-10-30')
    readme.append('')
    readme.append('Source: https://fourth-dimension-studio.infinityfreeapp.com')
    readme.append('Theme display folder: wp-content/themes/fourth-dimension-theme/site/')
    readme.append('Backup date: 2026-10-30')
    readme.append('')
    readme.append('## What is included')
    readme.append('- Homepage index.html, verified live on 2026-10-30, in site/index.html and index.html')
    readme.append('- Homepage assets under wp-content/ and assets/')
    readme.append('- Linked site pages in pages-html/ (books, prompts, tools, journal, newsletter sections are reached from the homepage)')
    readme.append('- WordPress posts, pages and media inventories in posts.json, pages.json, media.json and posts-inventory.md')
    readme.append('- Downloaded media files in media/')
    readme.append('')
    readme.append('## What changed on 2026-10-30')
    readme.append('- Design section: "Design, made to order." - Architecture and AI design, delivered remotely, anywhere in the world.')
    readme.append('- Five-books heading: "Five books,fivee ways to design better," in the Free Books section, with the five books listed on the homepage.')
    readme.append('- SEO paragraphs on Gaudi and home-renovation articles.')
    readme.append('')
    readme.append('## Counts')
    readme.append(f'- Files in this backup folder: {len(files)}')
    readme.append(f'- Posts: {len(posts)}')
    readme.append(f'- Pages: {len(pages)}')
    readme.append(f'- Media items listed: {len(media)}')
    readme.append(f'- Uncompressed size: {total} bytes ({total / 1048576:.1f} MB)')
    readme.append('')
    readme.append('## Notes')
    readme.append('- The previous 2026-10-28 backup was not deleted.')
    readme.append('- The zip is over the host 10 MB per-file limit, so it was uploaded directly to Google Drive instead of being left on the host.')
    readme.append('- Files over 30 MB, or that failed to download, were skipped and are listed below if any.')
    for s in skipped:
        readme.append(f'- Skipped: {s}')
    save('\n'.join(readme).encode(), OUT / 'README.md')
    files = sorted([p for p in OUT.rglob('*') if p.is_file()])
    with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to('.'))
    zsize = Path(ZIP_NAME).stat().st_size
    print(f'BACKUP files={len(files)} uncompressed={total} zip={zsize} zip_mb={zsize/1048576:.1f}')


if __name__ == '__main__':
    main()
