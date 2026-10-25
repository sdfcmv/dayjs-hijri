import { hijriToGregorian } from './calendar/conversion.js';

// YYYY-MM[-DD], YYYY/MM[/DD], or YYYYMM[DD], optionally followed by ISO time.
const DATE =
  /^(?:(\d{4})([-/])(\d{1,2})(?:\2(\d{1,2}))?|(\d{4})(\d{2})(\d{2})?)(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/i;

/** Translate only validated Hijri civil components, leaving time/offset to Day.js. */
export function parseHijri(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const match = DATE.exec(input);
  if (!match) return null;
  const year = Number(match[1] ?? match[5]);
  const month = Number(match[3] ?? match[6]);
  const day = Number(match[4] ?? match[7] ?? 1);
  const hour = Number(match[8] ?? 0);
  const minute = Number(match[9] ?? 0);
  const second = Number(match[10] ?? 0);
  const zone = match[12] ?? '';
  if (hour > 23 || minute > 59 || second > 59) return null;
  if (zone && zone.toUpperCase() !== 'Z') {
    const digits = zone.slice(1).replace(':', '');
    if (Number(digits.slice(0, 2)) > 23 || Number(digits.slice(2)) > 59)
      return null;
  }
  try {
    const date = hijriToGregorian(year, month, day);
    const civilDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    const time =
      match[8] === undefined
        ? ''
        : `T${match[8]}:${match[9]}:${match[10] ?? '00'}.${(match[11] ?? '0').padEnd(3, '0')}${zone}`;
    return civilDate + time;
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}
