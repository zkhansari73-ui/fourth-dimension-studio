# Fourth Dimension Studio — Project State and Backup Manifest

Last verified: 2026-10-17 (Asia/Tehran)

## Start here on any computer

1. Open the private repository: https://github.com/zkhansari73-ui/fourth-dimension-studio
2. Read `docs/CONTINUE-HERE.md`, then `docs/WORK_HANDOFF.md`, `docs/Fourth-Dimension-Studio-MASTER-Changes.md`, and `docs/RECOVERY.md`.
3. This manifest is also stored in the Google Drive folder “Fourth Dimension Studio Backups”.
4. Use the newest corrected WordPress theme archive linked below. Do not restore the older archive over newer host files.

## Current project state

- Website: https://fourth-dimension-studio.infinityfreeapp.com/
- Host: InfinityFree WordPress.
- GitHub repository: `zkhansari73-ui/fourth-dimension-studio`; primary branch: `main`.
- The 2026-10-17 language fallback update is merged to `main` in commit `a68d48b74d22342bd6cff321eac028bc5ac6ef0b` (PR #3).
- The latest user-provided theme archive was used as the base; the older 2026-10-07 archive was not used for these fixes.
- Corrected WordPress theme ZIP (46,877,247 bytes): https://drive.google.com/file/d/179I1Em7PXmZDoFuoYxo3hYNl9Iq93l1G/view?usp=drivesdk
- The ZIP changes four files: `site/index.html`, `site/journal/index.html`, `site/archive.js`, and `site/legal/privacy.html`.
- Reviewable copies of those four files are in `staged/wordpress-language-fix-2026-10-17/site/` on GitHub `main`.
- Checks completed: ZIP integrity and JavaScript syntax. The ZIP has not been installed on the live host.

## What is backed up

### GitHub

- Editable ChatGPT Sites/PWA source under `dist/`, including site assets documented in README.
- Automation source under `automation/` (Instagram reply service remains dry-run; news workflow is approval-gated).
- Master change log, recovery guide, handoff, and current staged theme source files.
- Existing dated PWA archive: `Fourth-Dimension-Studio-PWA-final-backup-2026-10-07.zip`.

### Google Drive — “Fourth Dimension Studio Backups”

- `Fourth-Dimension-Studio-PWA-final-backup-2026-10-07.zip` (older PWA backup; retain for rollback/reference).
- `Fourth-Dimension-WordPress-Theme-Language-Fix-2026-10-17.zip` (latest corrected theme package).
- This manifest and current continuation notes.

## Full live WordPress backup is still incomplete

The current theme ZIP and static/PWA source are not a complete live WordPress backup. The repository README and recovery guide indicate the following live-host exports are still needed:

- A fresh copy of `htdocs/wp-content/uploads/`.
- A fresh full theme directory from the live host, after comparing it with the current host so newer host-side work is preserved.
- Installed plugin list and plugin settings/exports.
- WordPress MySQL database export (`.sql`), which contains posts, pages, settings, and other database state.
- A redacted hosting/configuration inventory. Never store passwords, API keys, WordPress salts, `.env`, or active access tokens in GitHub or Drive.

The Drive’s 2026-10-07 PWA archive and any snapshot of public homepage media do not replace these exports. WordPress posts and other database content are not included in the theme ZIP.

## Host deployment and safety state

- The corrected 2026-10-17 ZIP has not been deployed to WordPress.
- Keep the current host version and existing host-side changes. Do not extract the full ZIP over the entire active theme.
- The file manager previously returned: “Extract path must be within an htdocs folder for security reasons.” Its extraction target must be under the website’s `htdocs` tree. Before copying anything, compare the current host files with the staged version and transfer the intended changes only.
- All new site changes must be staged and reviewed first, recorded in the master change log, and transferred to WordPress together after explicit final approval.
- Never ask the user to send hosting or WordPress passwords in chat. Use a secure login/authorization flow.

## Other known state to preserve

- Hero video is locked; compare the live WordPress Hero before changing it. Do not replace it based only on a filename.
- News automation must remain human-approval-gated and create drafts only; never publish automatically.
- GitHub Actions history contains failed GitHub Pages/Technical SEO and News Agent runs. Inspect and verify workflows before relying on them.
- Instagram comment reply service remains `DRY_RUN=true`; do not activate without approved rules and explicit instruction.

## Next actions to complete the full backup

1. From InfinityFree, download the current live theme and uploads; export database from phpMyAdmin; record plugins/settings.
2. Compare the live theme with the staged ZIP before replacing any file. Preserve the current live copy for rollback.
3. Upload the exports into a dated private Drive backup and add safe, non-secret source/configuration notes to GitHub.
4. Update this manifest with exact filenames, dates, and verification results. Do not claim a complete backup until the database, uploads, plugins/settings, and current live theme have been verified.


## Article completion — 2026-10-17

Two reviewed, trilingual (EN/FA/AR) articles were published in WordPress on 2026-10-17:

- Shenzhen Natural History Museum, WordPress post 92: https://fourth-dimension-studio.infinityfreeapp.com/2026/10/17/%d9%85%d9%88%d8%b2%d9%87%d9%94-%d8%aa%d8%a7%d8%b1%db%8c%d8%ae-%d8%b7%d8%a8%db%8c%d8%b9%db%8c-%d8%b4%d9%86%da%98%d9%86%d8%9b-%d9%be%d9%86%d8%ac-%d8%ad%d8%ac%d9%85-%d8%af%d8%b1-%d8%af%d9%84-%db%8c%da%a9/
- Claude Frontier Academy, WordPress post 94: https://fourth-dimension-studio.infinityfreeapp.com/2026/10/17/%d8%a2%da%a9%d8%a7%d8%af%d9%85%db%8c-claude-frontier%d8%9b-%d8%af%d8%b1%d8%b3%d9%87%d8%a7%db%8c%db%8c-%d8%a8%d8%b1%d8%a7%db%8c-%d8%a7%d8%b3%d8%aa%d9%88%d8%af%db%8c%d9%88%d9%87%d8%a7%db%8c/

- Each article contains separate EN, FA, and AR sections, image alt text/captions, sources, and AI-image disclosures. Eight 16:9 WebP images are in the WordPress Media Library.
- The Shenzhen draft was corrected to remove unsupported claims about BIM, Grasshopper, Revit, Rhino, and undocumented delivery methods. It relies on 3XN and Shenzhen municipal sources.
- The Claude article now explains that Anthropic's Academy trains enterprise software engineers, not architects or BIM teams; AEC relevance is marked as editorial guidance.
- The content tracker “Fourth Dimension Content Automation”, tab “Article Pipeline”, rows 9–10 records status Published and the verified WordPress/Drive URLs: https://docs.google.com/spreadsheets/d/1heSkaWrqIRfKxJnHvWP-kYdK9YbZEak07lSPuVyjO44/edit
- Google Drive article copies: Shenzhen https://drive.google.com/file/d/1Zdf2uRxmyiaRer3C34JJ8NrqjwriO6AT/view?usp=drivesdk ; Claude https://drive.google.com/file/d/13OIHfPb5nJ1P_9-a9TRQP-5tm6JbWEQJ/view?usp=drivesdk
- GitHub copies: `docs/published-articles/2026-10-17-shenzhen-natural-history-museum.en-fa-ar.html` and `docs/published-articles/2026-10-17-claude-frontier-academy.en-fa-ar.html`.

### Remaining live multilingual title issue

The live WordPress single-article shell still replaces the outer H1 with the “An Infinite Library” title on other article permalinks. The body language sections render, but the outer title is wrong. The Theme Editor rejected saving both PHP and HTML changes, so this fix is **not live**. A corrected, reviewable source file is now staged in GitHub at `staged/wordpress-language-fix-2026-10-17/site/index.html`; it scopes the old title override to `fd=article4` and uses each article's selected language heading for the outer title. To apply after keeping a copy of the live file, transfer that file to `htdocs/wp-content/themes/fourth-dimension-theme/site/index.html` using the hosting file manager, then verify `?lang=en`, `?lang=fa`, and `?lang=ar` on both new articles.


## Article language correction — 2026-10-17

- Posts 92 (Shenzhen Natural History Museum) and 94 (Claude Frontier Academy) are published with EN/FA/AR article sections, source lists, generated editorial images, and localized alt text/captions. Article Pipeline rows 9–10 are marked Published and Approved.
- Live verification found the body content in the selected language, but the global article header and browser title can still show the older “Infinite Library” title. Root cause: the legacy `fd-article-language-fix-v1` script applies the old article title to every article route.
- Staged fix commit: `b3a831d2567cbeaba0ef72936d1947ea13398bfd`. It scopes the legacy script to `?fd=article4` and localizes the dynamic article heading, browser title, article label, and studio-return link from the selected language section.
- One-file deployment archive: [Drive ZIP](https://drive.google.com/file/d/1yJt9suzVgXUXqWizN3CpvsOCmipt7uga/view?usp=drivesdk). ZIP contains only `site/index.html`; extract under `htdocs/wp-content/themes/fourth-dimension-theme/` to replace that one file. Back up the existing file first.
- Not yet deployed: this Cloud Browser session received 403 from filemanager.ai and the managed browser denied navigation to dash.infinityfree.com. No host files were changed.
