# Fourth Dimension Studio

Editable source backup for the Fourth Dimension Studio website.

## Included

- Current ChatGPT Sites source in `dist/`
- Hero and scroll videos
- Logo, poster, app icons, manifest and service worker
- Master change log and previous change lists in `docs/`
- Recovery notes in `docs/RECOVERY.md`
- Tested Instagram comment-reply service in `automation/instagram-auto-reply-service/`
- A dated live WordPress media snapshot is kept in the matching Google Drive backup for disaster recovery

## Important project rule

Changes dated 13 September 2026 onward are collected in the master change log and prepared offline. They must be reviewed and transferred to WordPress together, rather than applied one by one.

## WordPress backup status

This repository does not yet contain the live InfinityFree WordPress database, uploads, plugins, or PHP theme files. Those require an export from the InfinityFree control panel. See `docs/RECOVERY.md`.

The Drive snapshot contains only public assets observed on the homepage. It is not a substitute for the full theme, uploads and database export.

## Local preview

Serve the `dist` directory with any static web server. Opening `dist/index.html` directly may not register the service worker because browsers require HTTP/HTTPS for that feature.



## Continue from another computer
Start with [`docs/CONTINUE-HERE.md`](docs/CONTINUE-HERE.md), then read [the project state and backup manifest](docs/PROJECT-STATE-AND-BACKUP-MANIFEST-2026-10-17.md). The corrected WordPress theme ZIP is in the private Google Drive backup folder, linked from those files. The manifest lists what is backed up and what must still be exported from the live WordPress host.
