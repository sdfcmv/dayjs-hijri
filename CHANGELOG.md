# Changelog

## 2.0.0

- Use the `@smedigital/dayjs-hijri` package name.
- Preserve upstream MIT attribution and include SME Digital copyright and third-party notices in published files and JavaScript builds.
- Rewrite the plugin in strict TypeScript with separate pure calendar, parsing, locale, and Day.js integration modules.
- Add typed `dayjs.hijri`, calendar selection, plugin configuration, and pure conversion exports.
- Add Dhivehi (`dv`) Hijri month names for `MMM` and `MMMM` formatting.
- Ship ESM/CommonJS entry points, matching declarations, and source maps; declare Day.js as a peer dependency.
- Validate inputs and enforce the 1343–1500 AH Umm al-Qura range.
- Fix immutable setters, month-end clamping, weekday semantics, exact boundaries, UTC state, fixed offsets, and mixed-calendar differences.
- Correct the legacy 1354-12 month start using a pinned, attributed HijriDate table.
- Replace the expanded 6 MB fixture with compact month references and exhaustive daily conversion checks.
- Add typed linting, formatting, coverage thresholds, timezone/version CI, and packed-package consumer checks.

Breaking changes and compatibility limits are documented in the README migration guide. Legacy private fields and UMD/deep distribution paths are no longer supported.
