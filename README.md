# ذهبي — Dhahabi Frontend Apps

واجهة ذهبي مقسمة إلى **ثلاثة تطبيقات مستقلة** تشترك فقط في Backend واحد.

## التطبيقات

| التطبيق | المصدر | الدور المقبول | رابط GitHub Pages |
|---|---|---|---|
| المستخدم | `apps/user` | `USER` | https://ibr7h.github.io/gold-app-pwa/full/ |
| التاجر | `apps/trader` | `MERCHANT` | https://ibr7h.github.io/gold-app-pwa/trader/ |
| الإدارة | `apps/admin` | `ADMIN` | https://ibr7h.github.io/gold-app-pwa/admin/ |

Backend المشترك موجود في مستودع `ibr7h/gold-app`.

## قواعد الفصل

- لا يوجد Role Switcher في أي شاشة دخول.
- لكل تطبيق Manifest وService Worker وأيقونة وجلسة مستقلة.
- مفاتيح الجلسة:
  - User: `dhahabi_user_*`
  - Trader: `dhahabi_trader_*`
  - Admin: `dhahabi_admin_*`
- تطبيق المستخدم يرفض حسابات `MERCHANT` و`ADMIN`.
- تطبيق التاجر يقبل `MERCHANT` فقط.
- تطبيق الإدارة يقبل `ADMIN` فقط.
- التسجيل الذاتي موجود للمستخدم فقط.
- وظائف Trader/Admin غير الموجودة في Backend لا تُحاكى ببيانات وهمية؛ تظهر كتكاملات قيد التنفيذ.
- ألوان الهوية الثابتة: `#001F3F`, `#C5A021`, `#D4AF37`.

راجع `apps/README.md` لعقد الفصل بين التطبيقات.

## ملاحظة التوافق

المسار `/full/` هو تطبيق المستخدم الحالي، وقد تم الإبقاء عليه للحفاظ على الروابط والتثبيتات السابقة. جذر المستودع لم يعد تطبيقًا رابعًا؛ يحول فقط إلى تطبيق المستخدم.

Copyright © 2026 Ibrahim Alneami — All Rights Reserved
