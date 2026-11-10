# إعداد لوحة التحكم (Cloudflare D1)

اللوحة على الرابط: `https://دومينك/#/admin`

## الخطوات (مرة وحدة)

1. **أنشئ قاعدة البيانات** (على جهازك داخل مجلد المشروع):
   ```
   npx wrangler login
   npx wrangler d1 create plato-db
   ```
   بيطلع لك `database_id`. الصقه في `wrangler.toml` مكان `PUT-YOUR-DATABASE-ID-HERE`.

2. **أنشئ الجداول:**
   ```
   npx wrangler d1 execute plato-db --remote --file=schema.sql
   ```

3. **كلمة سر الأدمن:** Cloudflare ← Workers & Pages ← مشروع الموقع ← Settings ← Variables and Secrets ← Add ← الاسم `ADMIN_PASSWORD` والنوع Secret ← اكتب كلمة سر قوية.

4. **ارفع المشروع على GitHub** (Cloudflare Pages يبني تلقائياً عند كل push). إعدادات البناء: Build command `npm run build`، Output `dist`.

5. افتح `#/admin` وادخل بكلمة السر.

## ملاحظات
- الـAPI يشتغل على Cloudflare Pages فقط (GitHub Pages ما يدعم الدوال).
- تسجيل لاعب يزيد عدّاد المسجلين تلقائياً، ويرفض التكرار (نفس Plato ID في نفس البطولة) وإذا اكتمل العدد.
- في `npm run dev` الموقع يعرض بيانات تجريبية لأن الـAPI غير موجود محلياً.

## تنبيهات ديسكورد (اختياري)
1. في ديسكورد: إعدادات القناة ← Integrations ← Webhooks ← New Webhook ← انسخ الرابط.
2. Cloudflare ← مشروع الموقع ← Settings ← Variables and Secrets ← Add ← الاسم `DISCORD_WEBHOOK_URL` والنوع Secret ← الصق الرابط ← أعد النشر.
3. بعدها يوصل تنبيه تلقائي للقناة عند: نشر خبر جديد (أو تحويل مسودة لمنشور)، وفتح تسجيل بطولة جديدة (بطولة منشورة لم تنتهِ وبدون فائز).
