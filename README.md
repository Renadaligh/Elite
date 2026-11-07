# Elite

مجتمع Elite (ايليت) لنخبة لاعبي Plato.

هذا الموقع وُجد لخدمة مجتمع اللاعبين: يتابعون فيه آخر الأخبار، ويستعرضون الألعاب، ويسجّلون في البطولات، ويتعرّفون على الأبطال.

---

## للمطورين

React 18 · TypeScript · Tailwind CSS 3 · GSAP. عربي/إنجليزي (RTL). النشر على Cloudflare Pages.

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (dist/)
```

- `src/components/` — أقسام الصفحة · `src/i18n/translations.ts` — النصوص EN / AR · `src/config/site.ts` — القائمة والاسم
- `functions/` + `schema.sql` + `wrangler.toml` — الـAPI وقاعدة البيانات (Cloudflare Pages Functions + D1)
- لوحة التحكم: `#/admin` (انظر `ADMIN-SETUP.md`)
- الـ Hero: `HeroSection.tsx` + `ArtLayers.tsx` + `EliteWordmark.tsx`، والفيديو في `public/art/`
- «Plato ID» في نموذج التسجيل هو معرّف اللاعب داخل Plato، لذلك بقي اسمه.
