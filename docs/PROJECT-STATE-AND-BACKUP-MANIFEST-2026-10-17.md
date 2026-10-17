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

