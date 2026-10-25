import { MAX_HIJRI_YEAR, MIN_HIJRI_YEAR, MONTH_STARTS } from './ummalqura.js';

export interface CalendarDate {
  readonly year: number;
  /** One-based month (1–12). */
  readonly month: number;
  readonly day: number;
}

export interface HijriDate extends CalendarDate {
  readonly daysInMonth: number;
}

const MILLISECONDS_PER_DAY = 86_400_000;
const UNIX_EPOCH_RJD = 40_588;
const RANGE_MESSAGE =
  'Umm al-Qura supports 1343-01-01 through 1500-12-30 AH (1924-08-01 through 2077-11-16 CE).';

function integer(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a finite integer.`);
  }
}

/** Internal checked table access; the final entry is an exclusive end sentinel. */
export function monthStart(index: number): number {
  const value = MONTH_STARTS[index];
  if (value === undefined) throw new RangeError(RANGE_MESSAGE);
  return value;
}

export function hijriMonthIndex(year: number, month: number): number {
  integer(year, 'year');
  integer(month, 'month');
  if (
    year < MIN_HIJRI_YEAR ||
    year > MAX_HIJRI_YEAR ||
    month < 1 ||
    month > 12
  ) {
    throw new RangeError(RANGE_MESSAGE);
  }
  return (year - MIN_HIJRI_YEAR) * 12 + month - 1;
}

export function hijriDaysInMonth(year: number, month: number): number {
  const index = hijriMonthIndex(year, month);
  return monthStart(index + 1) - monthStart(index);
}

/** Convert a reduced Julian day number into Gregorian civil date components. */
export function rjdToGregorian(rjd: number): CalendarDate {
  const date = new Date((rjd - UNIX_EPOCH_RJD) * MILLISECONDS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

/** Convert a Gregorian civil date. Throws RangeError for invalid or unsupported dates. */
export function gregorianToHijri(
  year: number,
  month: number,
  day: number,
): HijriDate {
  integer(year, 'year');
  integer(month, 'month');
  integer(day, 'day');
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('Invalid Gregorian date.');
  }
  const rjd = date.getTime() / MILLISECONDS_PER_DAY + UNIX_EPOCH_RJD;
  if (rjd < monthStart(0) || rjd >= monthStart(MONTH_STARTS.length - 1)) {
    throw new RangeError(RANGE_MESSAGE);
  }

  // Upper bound search: find the month whose start is <= rjd < the next start.
  let low = 0;
  let high = MONTH_STARTS.length - 1;
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2);
    if (monthStart(middle) <= rjd) low = middle;
    else high = middle;
  }
  return {
    year: MIN_HIJRI_YEAR + Math.floor(low / 12),
    month: (low % 12) + 1,
    day: rjd - monthStart(low) + 1,
    daysInMonth: monthStart(low + 1) - monthStart(low),
  };
}

/** Convert a Hijri civil date. Months are one-based. Invalid dates never overflow. */
export function hijriToGregorian(
  year: number,
  month: number,
  day: number,
): CalendarDate {
  integer(day, 'day');
  const index = hijriMonthIndex(year, month);
  if (day < 1 || day > hijriDaysInMonth(year, month)) {
    throw new RangeError('Invalid Hijri day for this month.');
  }
  return rjdToGregorian(monthStart(index) + day - 1);
}
