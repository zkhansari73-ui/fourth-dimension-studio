# Addendum — 23 Oct 2026 (midday): intro page, hero video, journal fixes

## 1) Intro page rebuilt as a FULL information page (Zahra rejected the small centered box)
- Patch INTROPAGE on theme `site/index.html` + `site/styles.css` (block FDINTRO2): the entry layer is now a scrollable full page — logo + studio title + Enter button at top, "About the Studio" paragraph, 4 service cards (Villa / Facade / Interior / AI tools & content), "Inside this site" strip, founder line (Zahra Khansari), social links, second Enter button at the bottom. Trilingual via `.lg` spans shown per `html[lang]`.
- Backups on host: `index.html.bak-introfull-20261023`, `styles.css.bak-introfull-20261023`.
- Verified on clean profile: full page renders, all sections readable. Note: the site's fixed pill-nav row passes over card tops while scrolling (pre-existing fixed header behavior).

## 2) Hero video — light version (Zahra: video never loaded on her phone)
- Original: `fourth-dimension-hero-streamable.mp4` = 8.5MB, 1080p, 3.3Mbps, faststart OK — too heavy for the free host + mobile data.
- New: `fourth-dimension-hero-web.mp4` = 2.26MB, 720p, ~0.85Mbps, H.264 + AAC, faststart — uploaded to `wp-content/uploads/2026/09/` (original file kept untouched).
- Homepage `<source>` now points to the `-web` file and `preload="metadata"` → `preload="auto"` (buffers while the visitor reads the intro page). Backup: `index.html.bak-videoweb-20261023`.
- Verified on clean profile: video starts promptly after Enter, frames moving.

## 3) Journal / news page (`theme/site/journal/index.html`)
- Bug found: first news card title showed "Why it matters" (a section label extracted from content) instead of the post title.
- First patch attempt (JFIX) broke the page: the overlay block was inserted at `strrpos('</body>')`, which landed inside the page's big JS CSS-string and killed its script. Page rolled back the same hour to `.bak-jfix-20261023` (verified: 10 cards loading normally).
- JFIX2 (safe anchors, count-checked): title guard before `if(!t&&safeRaw(l,rawTitle))t=rawTitle;` — if a news card's extracted title is a known section label ("Why it matters", «چرا مهم است؟», category words, etc.) or <4 chars, it is discarded and the real post title is used. Loading overlay block (FDJLOAD2) inserted before `<section class="grid" id="grid">`. Backups: `.bak-jfix2-20261023`, broken version kept as `.bak-broken-jfix-20261023`.
- Verified: FA view first three cards now show the real newsletter titles (23/22/21 Oct). EN view falls back to the journal's own "Translation unavailable" label for Persian-titled posts (pre-existing design fallback). The gold-spinner overlay did not appear in captures; the page's own "Loading content…" text shows and cards arrive in ~2–5s — left as-is to avoid risking the page again.
- Lesson recorded in AGENTS.md: never anchor patches on `</body>`/`</html>` in this file.
