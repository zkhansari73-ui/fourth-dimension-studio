# Recovery guide

## Restore this static/PWA version

1. Download or clone the repository.
2. Upload the contents of `dist/` to a static web host.
3. Keep all paths under `dist/assets/` unchanged.
4. Confirm that the Hero video, service pages, tools page, manifest and service worker load correctly.

## Complete the WordPress backup

The live InfinityFree WordPress installation must be exported separately:

1. Download `htdocs/wp-content/themes/fourth-dimension-theme/`.
2. Download `htdocs/wp-content/uploads/`.
3. Record the installed plugin list and export any plugin settings that provide an export option.
4. Export the WordPress MySQL database as an `.sql` file from phpMyAdmin.
5. Do not commit passwords, API keys, WordPress salts, `.env` files or active access tokens.
6. Store a redacted `wp-config.example.php` only if configuration documentation is needed.

## Locked Hero requirement

The final WordPress Hero file is `fourth-dimension-hero-fullhd.mp4` and its intended path is:

`site/assets/fourth-dimension-hero-fullhd.mp4?v=2`

Keep the old `hero.mp4` only as a backup. The final Hero remains landscape 16:9, starts by click and preserves Sound ON behavior.

