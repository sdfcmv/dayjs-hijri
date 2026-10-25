# إضافة Day.js Hijri

إضافة TypeScript لدعم تقويم أم القرى، تطورها SME Digital. راجع [الدليل الرئيسي](../../README.md) للتثبيت وحدود التوافق والتغييرات عن الإصدار السابق.

## التثبيت

```sh
npm install @smedigital/dayjs-hijri 'dayjs@^1.11.13'
```

## الاستخدام

```ts
import dayjs from 'dayjs';
import hijri from '@smedigital/dayjs-hijri';
import 'dayjs/locale/ar.js';

dayjs.extend(hijri);

const date = dayjs('2025-01-07').calendar('hijri').locale('ar');
date.format('DD MMMM YYYY'); // '07 رجب 1446'
date.year(); // 1446
date.month(); // 6: يبدأ ترقيم الأشهر من الصفر في واجهة Day.js

const parsed = dayjs.hijri('1446-07-07');
parsed.calendar('gregory').format('YYYY-MM-DD'); // '2025-01-07'
parsed.add(1, 'month').format('YYYY-MM-DD'); // '1446-08-07'
```

تغيير التقويم يعيد نسخة جديدة ويحافظ على اللحظة الزمنية. التقويم الافتراضي ميلادي. ما زال التحليل باستخدام `dayjs('1446-07-07', { hijri: true })` مدعوماً ويعرض النتيجة بالتقويم الافتراضي.

## النطاق والتحقق

النطاق المدعوم هو 1343-01-01 إلى 1500-12-30 هجرياً، الموافق 1924-08-01 إلى 2077-11-16 ميلادياً. التواريخ الهجرية غير الصحيحة أو الخارجة عن النطاق تنتج قيمة غير صالحة؛ يمكن التحقق باستخدام `.isValid()`.

الإضافة تستخدم جدول أم القرى المدني ولا تحسب رؤية الهلال المحلية أو بداية اليوم عند الغروب. مصدر البيانات وترخيصه موضحان في [إشعارات المصادر الخارجية](../../THIRD_PARTY_NOTICES.md).

## UTC

```ts
import utc from 'dayjs/plugin/utc.js';

// يجب تحميل إضافة UTC قبل إضافة Hijri.
dayjs.extend(utc);
dayjs.extend(hijri);

dayjs.hijri('1446-07-07T23:30:00', { utc: true }).toISOString();
// '2025-01-07T23:30:00.000Z'
```

## الرخصة

MIT؛ انظر [LICENSE](../../LICENSE).
