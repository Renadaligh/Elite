# Plato AR · بلاتو العربي

**🌐 الموقع: [plato-ar.com](https://plato-ar.com)**

مجتمع Plato العربي. يتابع فيه اللاعبون الأخبار، ويستعرضون الألعاب، ويسجّلون في البطولات، وينظّمون بطولاتهم بأداة القرعة المجانية.

An Arabic community site for Plato players: news, games, tournament sign-ups, and a free tournament-bracket tool.
Live at **[plato-ar.com](https://plato-ar.com)**.

---

## الصفحات

| الرابط | المحتوى |
|---|---|
| [plato-ar.com](https://plato-ar.com) | الصفحة الرئيسية: الأخبار، الألعاب، البطولات |
| [plato-ar.com/bracket](https://plato-ar.com/bracket) | أداة تنظيم البطولات (القرعة) |
| `plato-ar.com/j/<id>` | رابط التسجيل في بطولة |
| `plato-ar.com/v/<id>` | صفحة عرض القرعة |
| `plato-ar.com/t/<id>` | صفحة البطولة في الموقع |
| `plato-ar.com/admin` | لوحة التحكم (انظر `ADMIN-SETUP.md`) |

---

## للمطورين

React 18 · TypeScript · Tailwind CSS 3 · GSAP. عربي/إنجليزي (RTL). النشر على Cloudflare Pages (Functions + D1 + R2).

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (dist/)
```

- `src/components/` — أقسام الصفحة وصفحات الأداة · `src/i18n/translations.ts` — النصوص EN / AR · `src/config/site.ts` — القائمة والاسم
- `functions/` + `schema.sql` + `wrangler.toml` — الـAPI وقاعدة البيانات
- لوحة التحكم: `/admin` (انظر `ADMIN-SETUP.md`)
- الـ Hero: `HeroSection.tsx` + `ArtLayers.tsx`، والصور في `public/art/`
- حركة التمرير (gsap) تُحمَّل عند الحاجة من `src/lib/loadGsap.ts`
- «Plato ID» في نموذج التسجيل هو معرّف اللاعب داخل Plato، لذلك بقي اسمه.
