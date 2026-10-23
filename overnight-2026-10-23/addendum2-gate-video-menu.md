# Addendum 2 — 23 Oct 2026 (afternoon): gate revert, video CDN + dual quality, menu restore

## Owner decisions (Zahra, explicit)
- The full intro/information page was REJECTED by Zahra (on her phone it rendered as an unstyled trilingual text mess due to a stale cached styles.css — the FDINTRO2 append had no ?v= bump). Final decision: entry gate = ONLY logo + site name + one Enter button, like the original.
- Hero video: frame appeared on her phone but never played — even via the direct file link, so the fault was the file/delivery path on the free host, not the page player.

## Actions
1. **REVERTGATE**: index.html + styles.css restored from `.bak-intromenu-20261023`; video src re-pointed to the light `-web` file + preload=auto. Full-intro state kept as `.bak-fullintro-20261023`.
2. **VIDEOPLAY**: `<video>` gained `autoplay muted loop` (muted autoplay is allowed on all phones; the site's own sound flow unmutes on Enter). Backup `.bak-videoplay-20261023`.
3. **VIDEOCDN**: new phone-safe encode `fourth-dimension-hero-mobile.mp4` (1.87MB, H.264 Main L4.0, yuv420p, AAC-LC) uploaded to the public GitHub repo at `media/`; homepage source switched to jsDelivr CDN. **Zahra confirmed on her phone: «پخش شد» (it plays).** Backup `.bak-videocdn-20261023`.
4. **Desktop quality**: `fourth-dimension-hero-desktop.mp4` (6.7MB, 1080p, CRF 24, Main profile) uploaded to `media/`; homepage now has two sources — desktop file with `media="(min-width: 769px)"` first, mobile file as fallback.
5. **MENUFIX + MENUHTML (owning a self-inflicted regression)**: the gate revert had silently rolled back last night's hamburger-menu tidy (CSS in styles.css survived via `.bak-fullintro`, but the `.menu-head`/`.menu-foot` markup lived in the newer index.html). Fixed in two steps: styles.css restored from `.bak-fullintro` truncated at the `/*FDINTRO2*/` marker (menu CSS back, intro-page CSS gone), `styles.css?v=3` bumped to `?v=5`; then the missing markup (gold `.menu-head` with trilingual spans + `.menu-foot` with Instagram/Telegram/YouTube/Pinterest + © 2026) re-inserted into the menu panel. Verified on clean profile: gold header, numbers 01–09, dividers, social footer all present. Backups: `.bak-menufix-20261023`, `.bak-menuhtml-20261023`.
6. Desktop inspection (clean profile): articles (12) and news (8) cards render fine. Pre-existing issues NOT fixed (owner has not asked): '04 / OPEN LAB' section is empty; Digital Shop category tiles are bare text placeholders; footer legal links overlap on one line.
