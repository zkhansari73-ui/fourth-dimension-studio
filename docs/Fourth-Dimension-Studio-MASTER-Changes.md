# فهرست مرکزی تغییرات سایت Fourth Dimension Studio

## قانون قطعی انتقال
از 13 سپتامبر 2026 به بعد:
- هیچ تغییر جدیدی جداگانه روی WordPress/هاست اعمال نشود.
- همه متن‌ها، تصاویر، ویدئوها و تغییرات طراحی/فنی ابتدا در نسخه آفلاین و همین فهرست مرکزی ثبت شوند.
- فقط پس از تأیید نهایی، همه تغییرات یک‌جا به WordPress منتقل شوند.

## موارد ثبت‌شده برای اعمال یکجا

### صفحه اصلی
- Search Bar کوچک/شیشه‌ای دقیقاً زیر Hero Video.
- کاهش فضای خالی زیر Hero.
- Search واقعی با Dropdown Suggestions.
- عرض Search در دسکتاپ حدود 60–75٪ و موبایل حدود 90–94٪.
- شش کارت شناور سه‌بعدی/Glass برای خدمات.
- تکمیل بخش Free Tools.

### Hero Video — قفل
- Hero Video نهایی است و نباید تغییر کند.
- فایل نهایی: fourth-dimension-hero-fullhd.mp4
- در site/index.html از `assets/fourth-dimension-hero-fullhd.mp4?v=2` استفاده شود.
- hero.mp4 به‌عنوان Backup حفظ شود.
- Hero افقی 16:9 بماند.
- هدر/ویدئو ظاهر سینمایی مشکی خود سایت را حفظ کند.

### ظاهر بخش اسکرولی
- فقط بخش Scroll زیر Hero به رنگ روشن، گرم، کرم/سنگی نزدیک به سایت مرجع تغییر کند.
- کل سایت روشن نشود.
- هویت بصری Fourth Dimension Studio حفظ شود.
- کارت‌ها و منوها: Glass Black با Accent/خط طلایی.
- ویدئو و Header مشکی و سینمایی باقی بمانند.

### ساختارها و بخش‌های جدید
- نوار بالایی آیکن‌دار خدمات
- More Menu
- Library
- Magazine
- Articles
- Shop
- Install App
- Contact
- Legal / Rules pages

### خدمات اصلی
1. Architecture & Interior/Exterior
2. AI Design & Content
3. Video / Teaser / Logo Motion
4. Web & App Design
5. Automation
6. Articles & Books

برای هر سرویس صفحه اختصاصی شامل Intro، Deliverables، Process و Order ساخته شود.

### زبان‌ها
- English پیش‌فرض
- Persian
- Arabic
- صفحات اصلی و خدمات سه‌زبانه شوند.

### عناصر برند
- CTA: Explore the studio
- پایین راست: Founder & Creative Director: Zahra Khansari / International Studio
- پایین چپ: International & Online

### محتوا و WordPress
- مقاله‌ها فقط به‌صورت Draft ساخته شوند.
- Featured Image افقی 16:9.
- هر مقاله شامل Title، Article، Excerpt، SEO و Categories باشد.
- انتشار نهایی فقط بعد از تأیید دستی.

### اتوماسیون و Agent
- Make
- Gemini
- ChatGPT
- Google Drive
- WordPress
- Composio
- GitHub
- Obsidian

### وضعیت فنی WordPress / InfinityFree
- اتصال REST به‌طور کامل قطع نیست.
- getPostStatuses و getPostFormats کار کرده‌اند.
- endpointهای types و categories با چالش JavaScript/Anti-bot میزبان InfinityFree مواجه شده‌اند.
- جریان فعلی Draft-only/انتقال دستی تا رفع مشکل هاست حفظ شود.

## محل نسخه طراحی
`htdocs/wp-content/themes/fourth-dimension-theme/site/`

Media: `site/assets/`

## یادآوری نهایی
هیچ‌کدام از موارد این فهرست نباید جداگانه روی WordPress اعمال شوند. تغییرات جدید باید به همین Master List اضافه شوند تا در پایان همه با هم منتقل شوند.



## وضعیت اتصال شبکه‌های اجتماعی — 26 سپتامبر 2026
- Instagram رسمی استودیو در نسخه GitHub متصل شد: `https://www.instagram.com/fourth.dimension.studio.ai/`
- Pinterest رسمی استودیو در نسخه GitHub متصل شد: `https://www.pinterest.com/fourthdimensionstudioai/`
- Telegram رسمی استودیو متصل شد: `https://t.me/FourthDimensionStudioAI` (فقط لینک عمومی؛ شماره تلفن در سایت یا مخزن ذخیره نشده است).
- Facebook رسمی استودیو متصل شد: `https://www.facebook.com/share/1GeGWH7cPd/`.
- ورود مستقیم به داشبورد Composio برای استخراج آدرس‌ها در این نوبت با خطای سرور روبه‌رو شد: Google OAuth = 502 و GitHub OAuth = 500.
- فایل ویدئوی Hero و تنظیمات پخش آن در این تغییر دست‌نخورده باقی ماند.
- نسخه قابل ادامه در مخزن خصوصی `zkhansari73-ui/fourth-dimension-studio` و شاخه `main` ذخیره شد.


## عامل محتوای Instagram — 26 سپتامبر 2026
- مشخصات کامل گردش‌کار در `automation/INSTAGRAM-CONTENT-AGENT.md` ثبت شد.
- ورودی کاربر: محتوای خام، تصاویر/ویدئو، زبان و نوع پست.
- خروجی عامل: کاور برندشده، کپشن، CTA، هشتگ، Alt Text، پیش‌نمایش و انتشار پس از تأیید.
- پاسخ خودکار فقط برای کامنت‌های عادی؛ قیمت، سفارش، پرداخت، شکایت و اطلاعات شخصی به صف تأیید زهرا منتقل شوند.
- ابزارهای Instagram Composio برای انتشار، دریافت کامنت، پاسخ و Webhook در طرح ثبت شدند.
- توکن‌ها و اطلاعات ورود در GitHub یا کد عمومی سایت ذخیره نشوند.

## پیاده‌سازی پاسخ خودکار Instagram — 27 سپتامبر 2026
- سرویس اجرایی در `automation/instagram-auto-reply-service/` اضافه شد.
- اتصال Composio و حساب `fourth.dimension.studio.ai` تأیید شد.
- سرویس در حالت امن `DRY_RUN=true` باقی می‌ماند تا پست و قوانین پاسخ توسط کاربر تأیید شوند.
- فیلتر کامنت مخفی، کامنت خود حساب، جلوگیری از تکرار، توقف امن و قرنطینهٔ نتیجهٔ مبهم پیاده‌سازی شد.
- 16 تست خودکار موفق اجرا شد.
- `.env`، کلید API، توکن‌ها، صف محلی و `node_modules` نباید در GitHub یا Google Drive ذخیره شوند.

## همگام‌سازی نسخه‌ها — 27 سپتامبر 2026
- نسخهٔ مرجع GitHub دارای لینک‌های درست Instagram، Pinterest، Telegram و Facebook است.
- نسخهٔ آنلاین WordPress هنوز قدیمی است و باید محتوای `dist/` به پوشهٔ `site/` منتقل شود.
- پس از انتقال، کش W3 Total Cache و کش میزبان باید پاک و لینک‌ها از مرورگر ناشناس دوباره بررسی شوند.
