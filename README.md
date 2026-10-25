# @smedigital/dayjs-hijri

A TypeScript Day.js plugin for the **Umm al-Qura Hijri calendar**, maintained by SME Digital. Convert, parse, format, and manipulate Hijri dates while preserving the underlying Gregorian instant.

- English, Arabic, and Dhivehi Hijri month names.
- Immutable calendar arithmetic, strict parsing, and UTC support.
- Pure conversion functions for use without registering the plugin.
- ESM and CommonJS builds with TypeScript declarations and source maps.

## Installation

```sh
npm install @smedigital/dayjs-hijri 'dayjs@^1.11.13'
```

Requires Node.js **22.12 or later** and Day.js **1.11.13 or later within 1.x**. Day.js is a peer dependency; the plugin has no other runtime dependencies.

## Quick start

```ts
import dayjs from 'dayjs';
import hijri from '@smedigital/dayjs-hijri';

dayjs.extend(hijri);

const date = dayjs('2025-01-07').calendar('hijri');
date.format('DD MMMM YYYY'); // '07 Rajab 1446'
date.year(); // 1446
date.month(); // 6 (Day.js months are zero-based)
date.date(); // 7

const parsed = dayjs.hijri('1446-07-07');
parsed.calendar('gregory').format('YYYY-MM-DD'); // '2025-01-07'
parsed.add(1, 'month').format('YYYY-MM-DD'); // '1446-08-07'
```

CommonJS:

```js
const dayjs = require('dayjs');
const { default: hijri } = require('@smedigital/dayjs-hijri');
dayjs.extend(hijri);
```

## Calendar selection and parsing

`.calendar('hijri' | 'gregory')` returns a clone with the same timestamp. `.calendar()` reports the selected calendar, and `.isHijri()` reports whether it is Hijri. Gregorian remains the default.

```ts
// Parse Hijri input, display Gregorian (legacy constructor API).
dayjs('1446-07-07', { hijri: true }).format('YYYY-MM-DD'); // '2025-01-07'

// Parse Hijri input and display Hijri (recommended factory).
dayjs.hijri('1446-07-07').format('YYYY-MM-DD'); // '1446-07-07'

// The input calendar and display calendar are independent.
dayjs('2025-01-07', { calendar: 'hijri' }).year(); // 1446
```

`dayjs.hijri` accepts `YYYY-MM[-DD]`, `YYYY/MM[/DD]`, and `YYYYMM[DD]`. A missing day means day 1. An optional time uses `T` or a space, `HH:mm[:ss[.SSS]]`, and optionally `Z` or an offset such as `+05:00` or `-0500`. Fractions accept one to three digits. Offset input describes an instant; the displayed civil date depends on the instance's local/UTC mode.

Invalid Hijri dates, malformed input, and unsupported dates produce invalid Day.js values: `.isValid()` is `false`, numeric calendar getters return `NaN`, and `.format()` returns `Invalid Date`. Parsing is strict: a nonexistent day never silently rolls into the next month. `{ hijri: true }` requires a string.

Applications that need a global display default can opt in:

```ts
dayjs.calendar('hijri');
dayjs('2025-01-07').year(); // 1446; input is still Gregorian

dayjs('2025-01-07', { calendar: 'gregory' }).year(); // 2025
dayjs.calendar('gregory');
```

Existing instances keep their display choice. Prefer per-instance selection in servers serving multiple users.

## Arithmetic and boundaries

In Hijri mode, `year`, `month`, `date`, `get`, `set`, `add`, `subtract`, `daysInMonth`, `startOf`, `endOf`, comparisons, and month/year differences use the Hijri calendar. Weekday numbers and elapsed time retain their usual Day.js meanings.

- Month/year setters and arithmetic clamp the day to the destination month's length.
- `.date(n)` permits overflow, following Day.js setter conventions; `.day(n)` sets the weekday.
- Boundaries use `00:00:00.000` and `23:59:59.999` in the instance's local/UTC mode.
- Hijri weeks start on Saturday. Configure this once with `dayjs.extend(hijri, { weekStart: 1 })` for Monday (0–6 = Sunday–Saturday).
- `diff(..., 'month' | 'year', true)` interpolates between clamped Hijri month anchors. At a dataset endpoint where a neighboring month is unavailable, interpolation uses the containing month's length.
- Manipulations return new instances and preserve the display calendar, locale, UTC mode, and fixed offset.

## Formatting and locales

Core Day.js date tokens (`YY`, `YYYY`, `M`, `MM`, `MMM`, `MMMM`, `D`, `DD`) refer to Hijri fields in Hijri mode. Weekday/time/offset tokens and bracketed literals keep their standard meaning. English, Arabic, and Dhivehi Hijri month names are included; other locales use English Hijri month names. The plugin does not replace Day.js locale definitions.

```ts
import 'dayjs/locale/ar.js';

dayjs.hijri('1446-07-07').locale('ar').format('DD MMMM YYYY'); // '07 رجب 1446'
```

For Dhivehi, load the Day.js `dv` locale and select it on the instance or globally with `dayjs.locale('dv')`. Both `MMM` and `MMMM` use the full Dhivehi month name.

```ts
import 'dayjs/locale/dv.js';

dayjs.hijri('1446-07-07').locale('dv').format('DD MMMM YYYY'); // '07 ރަޖަބު 1446'
dayjs.hijri('1446-09-01').locale('dv').format('MMMM'); // 'ރަމަޟާން'
```

## UTC and plugin compatibility

Load the official `utc`, `toArray`, and `weekday` plugins **before** this plugin when using them:

```ts
import utc from 'dayjs/plugin/utc.js';
dayjs.extend(utc);
dayjs.extend(hijri);

const date = dayjs.hijri('1446-07-07T23:30:00', { utc: true });
date.format(); // '1446-07-07T23:30:00Z'
date.toISOString(); // '2025-01-07T23:30:00.000Z'
date.local().isHijri(); // true
```

`toDate`, `toISOString`, JSON serialization, and timestamps represent the underlying Gregorian instant. The optional `toArray` plugin returns the selected calendar's year/month/day.

The supported integration surface is Day.js core plus UTC, fixed offsets, `weekday`, and `toArray`. Named-zone DST arithmetic, custom-format Hijri parsing, and tokens added by other formatting plugins are outside the current compatibility contract. The official Day.js `calendar` plugin uses the same method name and cannot be combined with this API. The mutation-oriented `badMutable` plugin is also incompatible.

## Pure conversion functions

These work without calling `dayjs.extend`. Months are **one-based**, unlike Day.js getters/setters. Results have readonly TypeScript fields. Invalid or unsupported inputs throw `RangeError`.

```ts
import {
  gregorianToHijri,
  hijriToGregorian,
  hijriDaysInMonth,
} from '@smedigital/dayjs-hijri';

gregorianToHijri(2025, 1, 7);
// { year: 1446, month: 7, day: 7, daysInMonth: 30 }

hijriToGregorian(1446, 7, 7);
// { year: 2025, month: 1, day: 7 }

hijriDaysInMonth(1446, 7); // 30
```

## Calendar data and range

Supported dates are **1343-01-01–1500-12-30 AH**, corresponding to **1924-08-01–2077-11-16 CE**, inclusive. Conversions use a pinned, bundled [HijriDate month-start table](https://github.com/dralshehri/hijridate/blob/f6f0f4f69da8e58dc65179213822ef7b83a77dcd/src/hijridate/ummalqura.py), independent of host ICU versions, with binary-search lookups. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for provenance, licensing, and the historical correction applied to the old table.

This is a civil Umm al-Qura calendar. It does not predict local moon sightings or sunset-based day boundaries. Some historical records have 28 or 31 days; the source data is preserved.

Gregorian dates outside this range remain valid in Gregorian mode. A Hijri view outside it is invalid; switching that view back to Gregorian recovers the original instant. No extrapolation is performed.

## Migration from 1.x

The documented `dayjs.extend`, `dayjs.calendar`, instance `.calendar`, and `{ hijri: true }` APIs remain. Version 2.0 changes the following:

- Imports use `@smedigital/dayjs-hijri` instead of `dayjs-hijri`.
- Type declarations and package exports replace legacy UMD/deep `dist/hijri-day.*` entry points.
- Invalid parsing is strict; out-of-range Hijri views are explicitly invalid.
- Month/year setters clamp consistently; `.day()` retains weekday semantics.
- Boundaries use exact start/end times rather than forcing 1 a.m.
- The start of 1354-12 AH moves one day earlier to match the pinned source.
- English month spellings are normalized (`Ramadan`, `Dhu al-Hijjah`, etc.).
- Private `$C`, `$hy`, `$hM`, `$hD`, `$fdow`, `InitHijri`, and locale `hMonths` fields are removed from the API. Use public getters and the typed `weekStart` option.

## Development

Use Node.js 22.12 or later.

```sh
npm ci
npm run check
```

`check` runs strict type checking, typed ESLint rules, formatting, coverage, the dual-format build, and isolated consumer tests against the actual npm tarball. The tests cover every supported day, all 1,896 retained month-start references, malformed input, immutable arithmetic, boundary times, UTC, fixed offsets, and public type contracts. CI runs across Node.js versions, host timezones, and the minimum/latest compatible Day.js versions.

To try unpublished changes in another project, build and pack the library:

```sh
npm run build
npm pack
```

Install the generated tarball in that project, alongside Day.js:

```sh
npm install /path/to/smedigital-dayjs-hijri-2.0.0.tgz 'dayjs@^1.11.13'
```

## License

MIT. Copyright (c) 2026 SME Digital. See [LICENSE](LICENSE) for the full license and retained upstream copyright notices. Calendar data attribution and its MIT license are included in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Both notice files ship in the npm package, and both JavaScript builds include the notices in a license comment.
