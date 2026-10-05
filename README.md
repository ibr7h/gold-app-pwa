# ذهبي — Gold App PWA

نسخة PWA مستقلة للواجهة العامة من تطبيق **ذهبي**.

## البنية
- `ibr7h/gold-app`: Backend مبني بـ NestJS + PostgreSQL.
- `ibr7h/gold-app-pwa`: واجهة PWA مستقلة للمستخدم.
- نسختا Trader وAdmin محفوظتان لمرحلة لاحقة كمشاريع مستقلة.

## v0.2.0
- أسعار الذهب 24/22/21/18 عبر `GET /prices/latest`.
- تسجيل الدخول عبر `POST /auth/login`.
- تجديد access token تلقائيًا عبر `POST /auth/refresh`.
- Portfolio API حقيقي: إنشاء محفظة افتراضية، قراءة المشتريات، الإضافة والحذف والملخص.
- Alerts API حقيقي: قراءة، إضافة، حذف، وتبديل Active/Paused.
- Offline/Demo fallback للمشتريات والتنبيهات عند غياب الاتصال.
- Manifest + Service Worker + Install Prompt.
- واجهة التجار محفوظة كنموذج حتى يضاف API التجار.

## Backend
من الإعدادات أدخل عنوان الـAPI المنشور عبر HTTPS.

يجب أن يسمح الـBackend بهذا الـOrigin:

```env
CORS_ORIGINS=https://ibr7h.github.io
```

## GitHub Pages
الرابط المتوقع بعد تفعيل Pages:

https://ibr7h.github.io/gold-app-pwa/

Copyright © 2026 Ibrahim Alneami — All Rights Reserved
