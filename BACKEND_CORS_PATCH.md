# Backend CORS patch

الـBackend الحالي في `src/main.ts` يسمح فقط بـ localhost/127.0.0.1.
قبل ربط GitHub Pages استخدم قائمة Origins من متغير البيئة:

```ts
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isLocal =
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin);

    return callback(
      isLocal || isAllowed ? null : new Error('Not allowed by CORS'),
      isLocal || isAllowed,
    );
  },
  credentials: true,
});
```

في بيئة الإنتاج:
`CORS_ORIGINS=https://ibr7h.github.io`
