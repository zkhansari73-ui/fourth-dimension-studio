# Fourth Dimension Studio — Work Handoff

## Purpose
This file is the current-state handoff for future Codex/Work sessions. Read it before changing automation or site deployment.

## Repository
- Repository: `zkhansari73-ui/fourth-dimension-studio`
- Primary branch: `main`
- Website: `https://fourth-dimension-studio.infinityfreeapp.com/`
- Website is WordPress-hosted; repository also contains automation and site assets.

## Current automation
- Workflow: `.github/workflows/news-agent.yml`
- Agent code: `automation/news-agent/`
- Schedule: `0 4 * * *` (07:30 Asia/Tehran). GitHub schedules can start later than the exact minute.
- Manual dispatch modes: `full` generates a new candidate; `publish-approved` handles only previously approved items.
- `NEWS_SCOUT_ENABLED: "true"` is required and was saved in commit `6d224c6` on 2026-10-07.
- `NEWS_GENERATE_IMAGES: "true"`, `NEWS_IMAGES_PER_ARTICLE: "4"`, `NEWS_MIN_TOTAL_SCORE: "70"`.

## Required behavior
1. Find one strong, relevant news candidate per daily run.
2. Score and verify it before using Gemini.
3. Generate SEO-focused article copy, keywords, and four images only for the selected candidate.
4. Add the result to Google Sheet `News Pipeline` for human approval.
5. Do NOT publish publicly until the owner approves it. The approved-article workflow must create a WordPress draft, not a public post.

## Cost-control policy
- Generate only one candidate/article per daily run.
- Do not generate images for rejected/low-score sources.
- Keep the threshold at 70 unless the owner asks otherwise.
- Reuse linked Composio accounts and configured GitHub secrets; never expose, replace, or commit secrets.

## Known history
- Workflow run #17 on 2026-10-07 completed in 15 seconds but did not generate content because logs showed `NEWS_SCOUT_ENABLED=false`.
- The workflow was corrected in commit `6d224c6` to pass `NEWS_SCOUT_ENABLED: "true"`.
- Next safe verification: manually dispatch `full`, inspect its logs, and confirm that an item with four images is added to `News Pipeline`. Do not publish it.

## PWA/site note
- The PWA install manifest and icon changes are managed separately in the WordPress site. Android launchers may impose a white adaptive-icon plate even when the source PNG is transparent.
- Do not replace the approved gold 3D 4D logo without owner approval.

## Prompt for a future Work session
> Read `docs/WORK_HANDOFF.md`, inspect the latest GitHub Actions run, then continue the daily news automation. Verify the full run creates one approval-gated item in `News Pipeline` with SEO copy and four images. Do not publish publicly.

## Backup
- Repository contains `Fourth-Dimension-Studio-PWA-final-backup-2026-10-07.zip`.
- Important changes must be committed to `main` so they are available on mobile and in future Work sessions.


## Prepared WordPress theme language fix — 2026-10-17
- Latest user-provided theme ZIP was used as the base; the older 2026-10-07 backup was not used.
- Corrected ZIP is stored in Google Drive: [Fourth-Dimension-WordPress-Theme-Language-Fix-2026-10-17.zip](https://drive.google.com/file/d/179I1Em7PXmZDoFuoYxo3hYNl9Iq93l1G/view?usp=drivesdk).
- The package changes four files: `site/index.html`, `site/journal/index.html`, `site/archive.js`, and `site/legal/privacy.html`.
- Checks completed: ZIP integrity and JavaScript syntax.
- Hosting status: this package has not been installed. Preserve any newer host-side work; review file differences before copying. Do not extract over the whole live theme. The file manager's extract destination must be inside the site's `htdocs` tree.
- Continue by reviewing this prepared change and the master log. Apply the approved site changes together, then verify each language on the live site.

- Reviewable copies of the four changed source files are under `staged/wordpress-language-fix-2026-10-17/site/` on `main`. PR #3 was merged at commit `a68d48b74d22342bd6cff321eac028bc5ac6ef0b`.


## Cross-device project state and full backup
- Start every new session with [docs/PROJECT-STATE-AND-BACKUP-MANIFEST-2026-10-17.md](PROJECT-STATE-AND-BACKUP-MANIFEST-2026-10-17.md).
- The theme language fix is staged in GitHub main and the full corrected ZIP is in Drive; it is not deployed to WordPress.
- A full live WordPress backup is still missing the latest uploads directory, full live theme snapshot, plugin/settings exports, and database export. See the manifest and `docs/RECOVERY.md`.
- Preserve host-side changes; compare before replacing files. Never put credentials or secrets in chat, GitHub, or Drive.
