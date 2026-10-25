import type { Dayjs, PluginFunc } from 'dayjs';
import {
  gregorianToHijri,
  hijriDaysInMonth,
  hijriMonthIndex,
  monthStart,
  rjdToGregorian,
} from './calendar/conversion.js';
import type { HijriDate } from './calendar/conversion.js';
import { internal, optionalHooks } from './dayjs-internals.js';
import { monthName } from './locale.js';
import { parseHijri } from './parse.js';
import type { Calendar, HijriPluginOptions } from './types.js';

const INVALID_PARTS: HijriDate = {
  year: NaN,
  month: NaN,
  day: NaN,
  daysInMonth: NaN,
};
const FORMAT_TOKENS = /\[[^\]]*\]|YYYY|YY|MMMM|MMM|MM|M|DD|D/g;

function normalizeUnit(unit?: string): string {
  const aliases: Readonly<Record<string, string>> = {
    y: 'year',
    M: 'month',
    D: 'date',
    d: 'day',
    w: 'week',
    h: 'hour',
    m: 'minute',
    s: 'second',
    ms: 'millisecond',
  };
  return (
    (unit && aliases[unit]) || (unit ?? '').toLowerCase().replace(/s$/, '')
  );
}

function assertCalendar(calendar: Calendar): void {
  if (calendar !== 'hijri' && calendar !== 'gregory') {
    throw new RangeError('Calendar must be "hijri" or "gregory".');
  }
}

const hijriPlugin: PluginFunc<HijriPluginOptions> = (
  options,
  DayjsClass,
  dayjs,
) => {
  const proto = DayjsClass.prototype;
  const hooks = internal(proto);
  const weekStart = options?.weekStart ?? 6;
  if (!Number.isInteger(weekStart) || weekStart < 0 || weekStart > 6) {
    throw new RangeError('weekStart must be an integer from 0 through 6.');
  }
  let defaultCalendar: Calendar = 'gregory';

  /* eslint-disable @typescript-eslint/unbound-method -- Plugin hooks must retain dynamic receivers; all originals are invoked with .call(). */
  const original = {
    parse: hooks.parse,
    set: hooks.$set,
    year: proto.year as (this: Dayjs) => number,
    month: proto.month as (this: Dayjs) => number,
    date: proto.date as (this: Dayjs) => number,
    add: proto.add,
    startOf: proto.startOf as (
      this: Dayjs,
      unit?: string,
      start?: boolean,
    ) => Dayjs,
    format: proto.format,
    diff: proto.diff,
    daysInMonth: proto.daysInMonth,
    isValid: proto.isValid,
  };
  /* eslint-enable @typescript-eslint/unbound-method */

  function fields(instance: Dayjs): HijriDate {
    if (!original.isValid.call(instance)) return INVALID_PARTS;
    try {
      return gregorianToHijri(
        original.year.call(instance),
        original.month.call(instance) + 1,
        original.date.call(instance),
      );
    } catch (error) {
      if (error instanceof RangeError) return INVALID_PARTS;
      throw error;
    }
  }

  function invalid(instance: Dayjs): Dayjs {
    const clone = instance.clone();
    internal(clone).$d = new Date(NaN);
    internal(clone).init();
    return clone;
  }

  /** Set all civil components atomically, retaining local/UTC time and offset metadata. */
  function setCivil(
    instance: Dayjs,
    year: number,
    month: number,
    day: number,
  ): Dayjs {
    const target = internal(instance);
    if (target.$u) target.$d.setUTCFullYear(year, month - 1, day);
    else target.$d.setFullYear(year, month - 1, day);
    target.init();
    return instance;
  }

  function setHijri(
    instance: Dayjs,
    year: number,
    zeroBasedMonth: number,
    day: number,
    clamp: boolean,
  ): Dayjs {
    if (![year, zeroBasedMonth, day].every(Number.isFinite))
      return setCivil(instance, NaN, NaN, NaN);
    year = Math.trunc(year);
    zeroBasedMonth = Math.trunc(zeroBasedMonth);
    year += Math.floor(zeroBasedMonth / 12);
    const month = (((zeroBasedMonth % 12) + 12) % 12) + 1;
    try {
      const index = hijriMonthIndex(year, month);
      const targetDay = clamp
        ? Math.min(Math.trunc(day), hijriDaysInMonth(year, month))
        : Math.trunc(day);
      const civil = rjdToGregorian(monthStart(index) + targetDay - 1);
      return setCivil(instance, civil.year, civil.month, civil.day);
    } catch (error) {
      if (error instanceof RangeError) return setCivil(instance, NaN, NaN, NaN);
      throw error;
    }
  }

  hooks.parse = function (config) {
    const calendar =
      config.calendar ??
      config.x?.hijriCalendar ??
      (config.x ? 'gregory' : defaultCalendar);
    assertCalendar(calendar);
    this.$x = { ...config.x, hijriCalendar: calendar };
    // Do not mutate caller-owned configuration or let malformed input fall back
    // to JavaScript's permissive Gregorian parser.
    const date = config.hijri
      ? (parseHijri(config.date) ?? new Date(NaN))
      : config.date;
    original.parse.call(this, { ...config, date });
  };

  dayjs.calendar = (calendar) => {
    assertCalendar(calendar);
    defaultCalendar = calendar;
    return dayjs;
  };
  dayjs.hijri = (input, config) => {
    if (config?.utc && !('utc' in dayjs))
      throw new TypeError(
        'Extend Day.js with the UTC plugin before using utc: true.',
      );
    return dayjs(input, {
      ...config,
      hijri: true,
      calendar: config?.calendar ?? 'hijri',
    });
  };

  function calendar(this: Dayjs): Calendar;
  function calendar(this: Dayjs, value: Calendar): Dayjs;
  function calendar(this: Dayjs, value?: Calendar): Calendar | Dayjs {
    if (value === undefined)
      return internal(this).$x.hijriCalendar ?? 'gregory';
    assertCalendar(value);
    const clone = this.clone();
    internal(clone).$x = { ...internal(clone).$x, hijriCalendar: value };
    return clone;
  }
  proto.calendar = calendar;
  proto.isHijri = function () {
    return this.calendar() === 'hijri';
  };
  proto.isValid = function () {
    return (
      original.isValid.call(this) &&
      (!this.isHijri() || Number.isFinite(fields(this).year))
    );
  };

  function year(this: Dayjs): number;
  function year(this: Dayjs, value: number): Dayjs;
  function year(this: Dayjs, value?: number): number | Dayjs {
    if (value !== undefined) return this.set('year', value);
    return this.isHijri() ? fields(this).year : original.year.call(this);
  }
  function month(this: Dayjs): number;
  function month(this: Dayjs, value: number): Dayjs;
  function month(this: Dayjs, value?: number): number | Dayjs {
    if (value !== undefined) return this.set('month', value);
    return this.isHijri() ? fields(this).month - 1 : original.month.call(this);
  }
  function date(this: Dayjs): number;
  function date(this: Dayjs, value: number): Dayjs;
  function date(this: Dayjs, value?: number): number | Dayjs {
    if (value !== undefined) return this.set('date', value);
    return this.isHijri() ? fields(this).day : original.date.call(this);
  }
  proto.year = year;
  proto.month = month;
  proto.date = date;

  hooks.$set = function (unit, value) {
    if (!this.isHijri()) return original.set.call(this, unit, value);
    const normalized = normalizeUnit(unit);
    const current = fields(this);
    switch (normalized) {
      case 'year':
        return setHijri(this, value, current.month - 1, current.day, true);
      case 'month':
        return setHijri(this, current.year, value, current.day, true);
      case 'date':
        return setHijri(this, current.year, current.month - 1, value, false);
      default:
        return original.set.call(this, unit, value);
    }
  };

  proto.add = function (amount, unit) {
    const normalized = normalizeUnit(unit);
    if (!this.isHijri() || (normalized !== 'month' && normalized !== 'year')) {
      return original.add.call(this, amount, unit);
    }
    if (!this.isValid()) return invalid(this);
    const current = fields(this);
    return normalized === 'month'
      ? setHijri(
          this.clone(),
          current.year,
          current.month - 1 + Number(amount),
          current.day,
          true,
        )
      : setHijri(
          this.clone(),
          current.year + Number(amount),
          current.month - 1,
          current.day,
          true,
        );
  };

  proto.daysInMonth = function () {
    return this.isHijri()
      ? fields(this).daysInMonth
      : original.daysInMonth.call(this);
  };

  function timeBoundary(instance: Dayjs, unit: string, start: boolean): Dayjs {
    const result = instance.clone();
    const target = internal(result);
    const end = start ? ([0, 0, 0, 0] as const) : ([23, 59, 59, 999] as const);
    const utc = target.$u;
    switch (unit) {
      case 'day':
      case 'date':
        if (utc) target.$d.setUTCHours(end[0], end[1], end[2], end[3]);
        else target.$d.setHours(end[0], end[1], end[2], end[3]);
        break;
      case 'hour':
        if (utc) target.$d.setUTCMinutes(end[1], end[2], end[3]);
        else target.$d.setMinutes(end[1], end[2], end[3]);
        break;
      case 'minute':
        if (utc) target.$d.setUTCSeconds(end[2], end[3]);
        else target.$d.setSeconds(end[2], end[3]);
        break;
      case 'second':
        if (utc) target.$d.setUTCMilliseconds(end[3]);
        else target.$d.setMilliseconds(end[3]);
        break;
    }
    target.init();
    return result;
  }

  proto.startOf = function (unit, start = true) {
    if (!this.isHijri()) return original.startOf.call(this, unit, start);
    if (!this.isValid()) return invalid(this);
    const current = fields(this);
    const normalized = normalizeUnit(unit);
    let result: Dayjs;
    switch (normalized) {
      case 'year':
        result = setHijri(
          this.clone(),
          current.year,
          start ? 0 : 11,
          start ? 1 : hijriDaysInMonth(current.year, 12),
          false,
        );
        break;
      case 'month':
        result = setHijri(
          this.clone(),
          current.year,
          current.month - 1,
          start ? 1 : current.daysInMonth,
          false,
        );
        break;
      case 'week': {
        const offset = (this.day() - weekStart + 7) % 7;
        result = original.add.call(this, start ? -offset : 6 - offset, 'day');
        break;
      }
      default:
        return timeBoundary(this, normalized, start);
    }
    return timeBoundary(result, 'day', start);
  };

  proto.format = function (template) {
    if (!this.isHijri() || !this.isValid())
      return original.format.call(this, template);
    const current = fields(this);
    const pattern =
      template ||
      (internal(this).$u ? 'YYYY-MM-DDTHH:mm:ss[Z]' : 'YYYY-MM-DDTHH:mm:ssZ');
    const translated = pattern.replace(FORMAT_TOKENS, (token) => {
      if (token.startsWith('[')) return token;
      let value: string;
      switch (token) {
        case 'YYYY':
          value = String(current.year).padStart(4, '0');
          break;
        case 'YY':
          value = String(current.year).slice(-2);
          break;
        case 'M':
          value = String(current.month);
          break;
        case 'MM':
          value = String(current.month).padStart(2, '0');
          break;
        case 'MMM':
          value = monthName(current.month, this.locale(), true);
          break;
        case 'MMMM':
          value = monthName(current.month, this.locale(), false);
          break;
        case 'D':
          value = String(current.day);
          break;
        default:
          value = String(current.day).padStart(2, '0');
      }
      return `[${value}]`;
    });
    return original.format.call(this, translated);
  };

  // Interpolate against clamped Hijri month anchors, as Day.js does for Gregorian
  // months. Both operands must use the same calendar, regardless of global state.
  function monthDifference(left: Dayjs, right: Dayjs): number {
    if (left.date() < right.date()) return -monthDifference(right, left);
    const months =
      (right.year() - left.year()) * 12 + right.month() - left.month();
    const anchor = left.add(months, 'month');
    const before = right.valueOf() < anchor.valueOf();
    const adjacent = left.add(months + (before ? -1 : 1), 'month');
    // At the two data endpoints the neighboring month may be unavailable.
    // Use the containing month's length rather than inventing external data.
    const denominator = adjacent.isValid()
      ? before
        ? anchor.valueOf() - adjacent.valueOf()
        : adjacent.valueOf() - anchor.valueOf()
      : fields(anchor).daysInMonth * 86_400_000;
    const result = -(
      months +
      (right.valueOf() - anchor.valueOf()) / denominator
    );
    return result === 0 ? 0 : result;
  }
  proto.diff = function (input, unit, floating) {
    const normalized = normalizeUnit(unit);
    if (!this.isHijri() || (normalized !== 'month' && normalized !== 'year')) {
      return original.diff.call(this, input, unit, floating);
    }
    const other = dayjs(input).calendar('hijri');
    if (!this.isValid() || !other.isValid()) return NaN;
    let result = monthDifference(this, other);
    if (normalized === 'year') result /= 12;
    const whole = Math.trunc(result);
    return floating ? result : whole === 0 ? 0 : whole;
  };
  // Load these official plugins before this adapter so their result factories
  // retain our display choice without replacing Day.js's own clone machinery.
  const optional = optionalHooks(proto);
  const oldUtc = optional.utc;
  const oldLocal = optional.local;
  const oldToArray = optional.toArray;
  if (oldUtc)
    optional.utc = function (keepLocalTime) {
      return oldUtc.call(this, keepLocalTime).calendar(this.calendar());
    };
  if (oldLocal)
    optional.local = function () {
      return oldLocal.call(this).calendar(this.calendar());
    };
  if (oldToArray)
    optional.toArray = function () {
      if (!this.isHijri()) return oldToArray.call(this);
      return [
        this.year(),
        this.month(),
        this.date(),
        this.hour(),
        this.minute(),
        this.second(),
        this.millisecond(),
      ];
    };
};

export default hijriPlugin;
