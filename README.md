# Elite

الموقع الرسمي لمجتمع Elite (ايليت) — ألعاب وبطولات. ثيم داكن بالأبيض/الأسود مع الأحمر، وهيرو فيديو الجبال والننجا.
React 18 · TypeScript · Tailwind CSS 3 · GSAP. عربي/إنجليزي (RTL).

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (dist/)
```

## البنية
- `src/components/` — أقسام الصفحة (Hero، الأخبار، الألعاب، البطولات، الأبطال، …) ونموذج التسجيل.
- `src/i18n/translations.ts` — نصوص EN / AR (المفاتيح متطابقة في اللغتين).
- `src/config/site.ts` — قائمة التنقل واسم الموقع (`BRAND`).
- `functions/` — الـAPI (Cloudflare Pages Functions) للأخبار والبطولات والتسجيلات.
- `schema.sql` / `wrangler.toml` — قاعدة البيانات (Cloudflare D1).
- `src/components/AdminPage.tsx` — لوحة التحكم على `#/admin` (انظر `ADMIN-SETUP.md`).
- `src/data/` — الألعاب، وبيانات تجريبية تظهر في `npm run dev` فقط.

## النشر
- Cloudflare Pages فقط (الـAPI يحتاج Functions): Build command `npm run build` · Output `dist`.

## ملاحظات
- الـ Hero: `src/components/HeroSection.tsx` + `ArtLayers.tsx` + `EliteWordmark.tsx`، والفيديو في `public/art/`.
- «Plato ID» في نموذج التسجيل هو معرّف اللاعب داخل لعبة Plato، لذلك بقي اسمه.
