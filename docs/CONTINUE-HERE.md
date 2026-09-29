# ادامه پروژه Fourth Dimension Studio

آخرین به‌روزرسانی: 29 سپتامبر 2026

## بسته اصلاح اعتماد، حقوقی و SEO
- نسخه آفلاین مرحله اول آماده شده است.
- canonical، Open Graph، Twitter Card، Schema و hreflang افزوده شد.
- همهٔ لینک‌ها و جایگاه‌های خالی شبکه‌های اجتماعی بدون حذف باقی ماندند تا بعداً تکمیل شوند.
- صفحات آماده‌سازی Journal و Shop اضافه شدند، اما لینک‌های فعلی آن‌ها برای تکمیل آینده دست‌نخورده باقی ماند.
- Privacy، Terms، Cookies، Sales & Refunds و AI Disclaimer ساخته شد.
- robots.txt و sitemap.xml افزوده شد.
- پارامتر ?lang=en|fa|ar اکنون زبان انتخابی را در URL حفظ می‌کند.
- بخش FAQ بدون حذف سؤال قبلی از ۱ سؤال به ۵ سؤال سه‌زبانه گسترش یافت: شروع پروژه، زبان‌ها، حریم خصوصی ابزارها و الزام تأیید انسانی.
- لینک فرم اطلاعات پروژه نیز به سه زبان ترجمه شد و در کنار راه تماس ایمیلی باقی ماند.
- متن حقوقی قبل از فروش واقعی باید برای کشور ثبت کسب‌وکار و درگاه پرداخت بازبینی حقوقی شود.
- مسیرهای حرفه‌ای وردپرس، دامنه اختصاصی، Search Console و بکاپ کامل دیتابیس/آپلود/قالب هنوز نیازمند کار روی هاست هستند.

## نقطه شروع
- شاخه اصلی: `main`
- صفحه اصلی قابل ویرایش: `dist/index.html`
- فهرست تصمیم‌ها: `docs/Fourth-Dimension-Studio-MASTER-Changes.md`
- راهنمای بازیابی: `docs/RECOVERY.md`

## شبکه‌های اجتماعی
- Instagram متصل: https://www.instagram.com/fourth.dimension.studio.ai/
- Pinterest متصل: https://www.pinterest.com/fourthdimensionstudioai/
- Telegram متصل: https://t.me/FourthDimensionStudioAI
- Facebook متصل: https://www.facebook.com/share/1GeGWH7cPd/
- شماره تلفن Telegram نباید در سایت یا مخزن ذخیره شود.
- لینک Facebook از گزینهٔ رسمی Share خود صفحه دریافت و در رابط سایت ثبت شده است.

## Composio
اتصال Instagram فعال و با شناسهٔ حساب `fourth.dimension.studio.ai` تأیید شده است. سرویس اجرایی پاسخ کامنت در `automation/instagram-auto-reply-service/` قرار دارد. این سرویس عمداً با `DRY_RUN=true` و فایل قوانین خالی نگه داشته شده تا پس از انتشار اولین پست و تأیید کاربر فعال شود. هیچ کلید یا توکن فعالی در مخزن ذخیره نمی‌شود.

## وضعیت انتشار WordPress
- نسخهٔ GitHub چهار لینک رسمی Instagram، Pinterest، Telegram و Facebook را دارد.
- نسخهٔ آنلاین WordPress در بررسی 27 سپتامبر هنوز Instagram قدیمی را نمایش می‌داد و سه لینک دیگر را نداشت.
- مسیر انتقال: `dist/` به `htdocs/wp-content/themes/fourth-dimension-theme/site/`
- پس از انتقال باید کش W3 Total Cache و کش میزبان پاک شود.

## Hero Video
- ویدئو، زمان‌بندی و محتوای آن بدون دستور صریح کاربر تغییر نکند.
- فایل قفل‌شده مورد انتظار WordPress: `fourth-dimension-hero-fullhd.mp4`
- مسیر مورد انتظار: `site/assets/fourth-dimension-hero-fullhd.mp4?v=2`
- برای ادامه، ابتدا نسخه موجود روی WordPress/InfinityFree با فایل مرجع تطبیق داده شود؛ هیچ ویدیویی صرفاً بر اساس نام فایل جایگزین نشود.

## قانون زبان
- English زبان پیش‌فرض
- Persian و Arabic کامل
- همه متن‌های عمومی باید با زبان انتخابی عوض شوند.
- مدیریت خصوصی سایت فقط فارسی بماند.

## قانون انتقال
تغییرات جدید ابتدا در نسخه آفلاین و Master ثبت شوند و پس از تأیید نهایی یک‌جا به WordPress منتقل شوند.
