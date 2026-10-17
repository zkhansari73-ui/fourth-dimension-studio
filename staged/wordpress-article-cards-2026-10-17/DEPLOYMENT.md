# Article publication handoff — 17 October 2026

## Published in WordPress

- Shenzhen Natural History Museum — WordPress post 92: https://fourth-dimension-studio.infinityfreeapp.com/2026/10/17/%d9%85%d9%88%d8%b2%d9%87%d9%94-%d8%aa%d8%a7%d8%b1%db%8c%d8%ae-%d8%b7%d8%a8%db%8c%d8%b9%db%8c-%d8%b4%d9%86%da%98%d9%86%d8%9b-%d9%be%d9%86%d8%ac-%d8%ad%d8%ac%d9%85-%d8%af%d8%b1-%d8%af%d9%84-%db%8c%da%a9/
- Claude Frontier Academy — WordPress post 94: https://fourth-dimension-studio.infinityfreeapp.com/2026/10/17/%d8%a2%da%a9%d8%a7%d8%af%d9%85%db%8c-claude-frontier%d8%9b-%d8%af%d8%b1%d8%b3%d9%87%d8%a7%db%8c%db%8c-%d8%a8%d8%b1%d8%a7%db%8c-%d8%a7%d8%b3%d8%aa%d9%88%d8%af%db%8c%d9%88%d9%87%d8%a7%db%8c/

Both contain separate English, Persian, and Arabic sections, cited sources, image descriptions, and AI-image disclosures. The Shenzhen story was corrected to remove unsupported BIM/Grasshopper/Revit/Rhino claims. The Claude story accurately describes Anthropic's Academy as enterprise software-engineer training; architecture applications are editorial suggestions.

## Backups and tracker

- Google Drive article files are stored in “Fourth Dimension Studio Backups”: Shenzhen https://drive.google.com/file/d/1Zdf2uRxmyiaRer3C34JJ8NrqjwriO6AT/view?usp=drivesdk ; Claude https://drive.google.com/file/d/13OIHfPb5nJ1P_9-a9TRQP-5tm6JbWEQJ/view?usp=drivesdk
- Tracker: “Fourth Dimension Content Automation”, tab “Article Pipeline”, rows 9–10, statuses Published: https://docs.google.com/spreadsheets/d/1heSkaWrqIRfKxJnHvWP-kYdK9YbZEak07lSPuVyjO44/edit
- GitHub article copies: docs/published-articles/2026-10-17-shenzhen-natural-history-museum.en-fa-ar.html and docs/published-articles/2026-10-17-claude-frontier-academy.en-fa-ar.html.
- GitHub project manifest updated at docs/PROJECT-STATE-AND-BACKUP-MANIFEST-2026-10-17.md.

## Article listing update — staged, not live

The home page Articles section now contains image cards for both published articles (Shenzhen Natural History Museum and Claude Frontier Academy). Each image, title, and “Read article” link opens the corresponding WordPress post and carries the selected FA/EN/AR language. The journal archive also has image and title links plus fallback entries, so these posts remain visible if they are missing from the WordPress “articles” category.

Deployment ZIP: [download from Google Drive](https://drive.google.com/file/d/16dMpuMKdcvhGNCZsy1AQq72yCY6_CH65/view?usp=drivesdk) (`fourth-dimension-article-cards.zip`) contains only `site/index.html` and `site/journal/index.html`. Upload it to `/htdocs/wp-content/themes/fourth-dimension-theme/` and extract with the destination path left blank. Before replacing, make copies of both existing files on the host. Do not extract the full theme archive.

This package also includes the earlier language-title correction: the legacy title fix now applies only to the Infinite Library post; other article pages use their own selected-language heading/title.

Not yet deployed: the Cloud Browser session’s saved host-permission gate denied the InfinityFree dashboard, and filemanager.ai returned 403. No live host files were changed or backed up from the host. The matching local pre-edit copies are in `work/final-articles/backups/article-cards-pre-edit/`; [download their local snapshot ZIP](https://drive.google.com/file/d/13eTUo7is31h3NTgMqQmVg50_URZ75Vyw/view?usp=drivesdk). This snapshot is not a host-side backup. GitHub source files are staged at `staged/wordpress-article-cards-2026-10-17/site/`.
