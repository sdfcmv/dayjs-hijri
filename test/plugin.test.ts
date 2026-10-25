import dayjs from 'dayjs';
import ar from 'dayjs/locale/ar.js';
import dv from 'dayjs/locale/dv.js';
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import hijri from '../src/index.js';
import type { Calendar, HijriDate } from '../src/index.js';
import { gregorianToHijri } from '../src/index.js';

dayjs.locale(ar, undefined, true);
dayjs.locale(dv, undefined, true);
dayjs.extend(hijri);
beforeEach(() => {
  dayjs.calendar('gregory');
});

describe('calendar selection', () => {
  it('leaves ordinary Gregorian behavior intact', () => {
    const value = dayjs('2025-01-31T12:34:56.789');
    expect(value.calendar()).toBe('gregory');
    expect(value.isHijri()).toBe(false);
    expect(value.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe(
      '2025-01-31 12:34:56.789',
    );
    expect(value.add(1, 'month').format('YYYY-MM-DD')).toBe('2025-02-28');
    expect(value.year()).toBe(2025);
    expect(value.month()).toBe(0);
    expect(value.date()).toBe(31);
    expect(value.daysInMonth()).toBe(31);
    expect(value.startOf('year').format('YYYY-MM-DD')).toBe('2025-01-01');
    expect(value.diff(value.add(1, 'month'), 'month')).toBe(-1);
  });

  it('changes the calendar immutably without changing the instant', () => {
    const value = dayjs('2025-01-07T16:12:34.567');
    const converted = value.calendar('hijri');
    expect(converted.format('YYYY-MM-DD')).toBe('1446-07-07');
    expect(converted.valueOf()).toBe(value.valueOf());
    expect(value.calendar()).toBe('gregory');
    expect(converted.calendar('gregory').format()).toBe(value.format());
    expect(dayjs(converted).calendar()).toBe('hijri');
    expect(converted.clone().calendar()).toBe('hijri');
  });

  it('keeps explicit instance choices when the default changes', () => {
    const existing = dayjs('2025-01-07');
    expect(dayjs.calendar('hijri')).toBe(dayjs);
    expect(dayjs('2025-01-07').year()).toBe(1446);
    expect(existing.clone().year()).toBe(2025);
    const explicit = dayjs('2025-01-07', { calendar: 'gregory' });
    expect(explicit.year()).toBe(2025);
    expect(dayjs.hijri('1446-07-07', { calendar: 'gregory' }).year()).toBe(
      2025,
    );
  });

  it('marks unsupported Hijri views invalid while allowing Gregorian dates outside the range', () => {
    const value = dayjs('1800-01-01');
    expect(value.isValid()).toBe(true);
    const view = value.calendar('hijri');
    expect(view.isValid()).toBe(false);
    expect(view.year()).toBeNaN();
    expect(view.month()).toBeNaN();
    expect(view.date()).toBeNaN();
    expect(view.daysInMonth()).toBeNaN();
    expect(view.format()).toBe('Invalid Date');
    expect(view.calendar('gregory').isValid()).toBe(true);
  });

  it('retains calendar state through core manipulation', () => {
    const value = dayjs.hijri('1446-07-07');
    for (const result of [
      value.add(1, 'day'),
      value.subtract(1, 'ms'),
      value.set('hour', 3),
      value.day(2),
      value.locale('ar'),
      value.startOf('day'),
      value.endOf('week'),
    ]) {
      expect(result.calendar()).toBe('hijri');
    }
  });
});

describe('parsing', () => {
  it.each(['1446-07-07', '1446/07/07', '14460707', '1446-7-7'])(
    'parses %s',
    (input) => {
      expect(dayjs.hijri(input).format('YYYY-MM-DD')).toBe('1446-07-07');
      expect(dayjs(input, { hijri: true }).format('YYYY-MM-DD')).toBe(
        '2025-01-07',
      );
    },
  );

  it.each(['1446-07', '1446/7', '144607'])(
    'defaults the missing day in %s to 1',
    (input) => {
      expect(dayjs.hijri(input).format('YYYY-MM-DD')).toBe('1446-07-01');
    },
  );

  it('keeps time, fractions, and explicit offsets', () => {
    expect(dayjs.hijri('1446-07-07T16:12:34.5').format('HH:mm:ss.SSS')).toBe(
      '16:12:34.500',
    );
    expect(dayjs.hijri('1446-07-07T16:12:34.567Z').toISOString()).toBe(
      '2025-01-07T16:12:34.567Z',
    );
    expect(dayjs.hijri('1446/07/07 16:12+05:00').toISOString()).toBe(
      '2025-01-07T11:12:00.000Z',
    );
    expect(dayjs.hijri('14460707T16:12-0500').toISOString()).toBe(
      '2025-01-07T21:12:00.000Z',
    );
  });

  it.each([
    '',
    'nonsense',
    '1446',
    '1446-00-01',
    '1446-13-01',
    '1446-05-30',
    '1446-07-00',
    '1342-12-29',
    '1501-01-01',
    '1446-07/01',
    '1446-07-01junk',
    '1446-07-01T24:00',
    '1446-07-01T00:60',
    '1446-07-01T00:00:60',
    '1446-07-01T00:00+24:00',
    '1446-07-01T00:00+00:60',
  ])('rejects malformed input %s', (input) => {
    const value = dayjs.hijri(input);
    expect(value.isValid()).toBe(false);
    expect(value.format()).toBe('Invalid Date');
    expect(value.year()).toBeNaN();
  });

  it('does not treat non-string Hijri inputs as Gregorian dates', () => {
    expect(dayjs(null, { hijri: true }).isValid()).toBe(false);
    expect(dayjs(new Date(), { hijri: true }).isValid()).toBe(false);
    expect(dayjs('', { calendar: 'hijri' }).isValid()).toBe(false);
  });

  it('requires UTC support explicitly', () => {
    expect(() => dayjs.hijri('1446-07-01', { utc: true })).toThrow(
      /UTC plugin/,
    );
  });
});

describe('formatting', () => {
  it('formats Hijri fields and delegates weekdays and time together', () => {
    const value = dayjs.hijri('1446-07-07T13:04:05.006');
    expect(value.format('YY YYYY M MM MMM MMMM D DD')).toBe(
      '46 1446 7 07 Raj Rajab 7 07',
    );
    expect(value.format('[Date:] YYYY-MM-DD [Time:] HH:mm:ss.SSS dddd')).toBe(
      'Date: 1446-07-07 Time: 13:04:05.006 Tuesday',
    );
    expect(value.format()).toMatch(/^1446-07-07T13:04:05[+-]\d{2}:\d{2}$/);
    expect(value.format('[YYYY-MM-DD]')).toBe('YYYY-MM-DD');
  });

  it('uses Arabic names without replacing Gregorian locale data', () => {
    const value = dayjs.hijri('1446-07-07').locale('ar');
    expect(value.format('MMM MMMM')).toBe('رجب رجب');
    expect(value.calendar('gregory').format('MMMM')).toBe('يناير');
    expect(dayjs.hijri('1446-09-01').format('MMMM')).toBe('Ramadan');
  });

  it.each([
    [1, 'މުޙައްރަމް'],
    [2, 'ޞަފަރު'],
    [3, 'ރަބީޢުލް އައްވަލް'],
    [4, 'ރަބީޢުލް އާޚިރު'],
    [5, 'ޖުމާދަލް އައްވަލް'],
    [6, 'ޖުމާދަލް އާޚިރާ'],
    [7, 'ރަޖަބު'],
    [8, 'ޝަޢުބާން'],
    [9, 'ރަމަޟާން'],
    [10, 'ޝައްވާލް'],
    [11, 'ޛުލްޤަޢިދާ'],
    [12, 'ޛުލްޙިއްޖާ'],
  ])('formats Dhivehi Hijri month %i', (month, name) => {
    const value = dayjs.hijri(`1446-${month}-01`).locale('dv');
    expect(value.format('MMMM')).toBe(name);
    expect(value.format('MMM')).toBe(name);
  });

  it('keeps Dhivehi weekdays and Gregorian month names intact', () => {
    const value = dayjs.hijri('1446-07-07').locale('dv');
    expect(value.format('dddd D MMMM YYYY')).toBe('އަންގާރަ 7 ރަޖަބު 1446');
    expect(value.calendar('gregory').format('MMM MMMM')).toBe(
      'ޖެނުއަރީ ޖެނުއަރީ',
    );
    expect(dayjs.hijri('1446-07-07').format('MMMM')).toBe('Rajab');
  });

  it('uses Dhivehi names for regional locales', () => {
    dayjs.locale({ ...dv, name: 'dv-mv' }, undefined, true);
    expect(dayjs.hijri('1446-09-01').locale('dv-mv').format('MMMM')).toBe(
      'ރަމަޟާން',
    );
  });
});

describe('arithmetic and setters', () => {
  it.each([
    ['day', 1, '1446-07-08'],
    ['week', 1, '1446-07-14'],
    ['month', 1, '1446-08-07'],
    ['year', 1, '1447-07-07'],
    ['M', 18, '1448-01-07'],
    ['months', -18, '1445-01-07'],
  ] as const)('adds %s by %s', (unit, amount, expected) => {
    expect(
      dayjs.hijri('1446-07-07').add(amount, unit).format('YYYY-MM-DD'),
    ).toBe(expected);
  });

  it('clamps month/year changes and preserves all clock fields', () => {
    const value = dayjs.hijri('1446-07-30T17:42:13.456');
    expect(value.add(1, 'month').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe(
      '1446-08-29 17:42:13.456',
    );
    expect(value.month(7).date()).toBe(29);
    expect(value.month(-1).format('YYYY-MM-DD')).toBe('1445-12-30');
    expect(value.month(12).format('YYYY-MM-DD')).toBe('1447-01-30');
    expect(value.year(1447).month()).toBe(6);
    expect(value.format('YYYY-MM-DD')).toBe('1446-07-30');
  });

  it('allows date overflow but keeps day setters as weekdays', () => {
    const value = dayjs.hijri('1446-07-01');
    expect(value.date(0).format('YYYY-MM-DD')).toBe('1446-06-30');
    expect(value.date(31).format('YYYY-MM-DD')).toBe('1446-08-01');
    expect(value.day(0).day()).toBe(0);
    expect(value.set('D', 2).date()).toBe(2);
    expect(value.set('d', 2).day()).toBe(2);
    expect(value.get('year')).toBe(1446);
    expect(value.get('month')).toBe(6);
    expect(value.get('date')).toBe(1);
  });

  it('rolls days and milliseconds through month/year boundaries', () => {
    expect(dayjs.hijri('1446-12-29').add(1, 'day').format('YYYY-MM-DD')).toBe(
      '1447-01-01',
    );
    expect(
      dayjs
        .hijri('1446-07-01')
        .subtract(1, 'ms')
        .format('YYYY-MM-DD HH:mm:ss.SSS'),
    ).toBe('1446-06-30 23:59:59.999');
    expect(
      dayjs.hijri('1446-06-01').add(100, 'days').format('YYYY-MM-DD'),
    ).toBe('1446-09-12');
  });

  it('keeps invalid values invalid and rejects non-finite setters', () => {
    const value = dayjs.hijri('bad');
    expect(value.add(1, 'month').isValid()).toBe(false);
    expect(value.startOf('year').isValid()).toBe(false);
    expect(dayjs.hijri('1446-01-01').month(NaN).isValid()).toBe(false);
    expect(dayjs.hijri('1446-01-01').year(1501).isValid()).toBe(false);
    expect(dayjs.hijri('1500-12-30').add(1, 'day').isValid()).toBe(false);
    expect(dayjs.hijri('1343-01-01').subtract(1, 'day').isValid()).toBe(false);
  });
});

describe('boundaries and comparisons', () => {
  it.each([
    ['year', '1446-01-01 00:00:00.000', '1446-12-29 23:59:59.999'],
    ['month', '1446-07-01 00:00:00.000', '1446-07-30 23:59:59.999'],
    ['week', '1446-07-04 00:00:00.000', '1446-07-10 23:59:59.999'],
    ['day', '1446-07-07 00:00:00.000', '1446-07-07 23:59:59.999'],
    ['hour', '1446-07-07 12:00:00.000', '1446-07-07 12:59:59.999'],
    ['minute', '1446-07-07 12:34:00.000', '1446-07-07 12:34:59.999'],
    ['second', '1446-07-07 12:34:56.000', '1446-07-07 12:34:56.999'],
  ] as const)('computes exact %s boundaries', (unit, start, end) => {
    const value = dayjs.hijri('1446-07-07T12:34:56.789');
    expect(value.startOf(unit).format('YYYY-MM-DD HH:mm:ss.SSS')).toBe(start);
    expect(value.endOf(unit).format('YYYY-MM-DD HH:mm:ss.SSS')).toBe(end);
  });

  it('handles the supported endpoints without requesting a nonexistent next month', () => {
    expect(dayjs.hijri('1500-12-01').endOf('year').format('YYYY-MM-DD')).toBe(
      '1500-12-30',
    );
    expect(dayjs.hijri('1500-12-01').endOf('month').date()).toBe(30);
    expect(dayjs.hijri('1343-01-20').startOf('year').format('YYYY-MM-DD')).toBe(
      '1343-01-01',
    );
  });

  it('compares by Hijri calendar units', () => {
    const value = dayjs.hijri('1446-07-07');
    expect(value.isSame(dayjs.hijri('1446-07-30'), 'month')).toBe(true);
    expect(value.isBefore(dayjs.hijri('1446-08-01'), 'month')).toBe(true);
    expect(value.isAfter(dayjs.hijri('1446-06-30'), 'month')).toBe(true);
    expect(value.startOf('millisecond').valueOf()).toBe(value.valueOf());
  });

  it('interpolates month/year differences with mixed display calendars', () => {
    const a = dayjs.hijri('1446-06-01');
    const b = dayjs.hijri('1446-09-12');
    expect(a.diff(b, 'month', true)).toBeCloseTo(-3.3793103448275863);
    expect(b.diff(a, 'month', true)).toBeCloseTo(3.3793103448275863);
    expect(a.diff(b.calendar('gregory'), 'month')).toBe(-3);
    expect(a.diff(b, 'year')).toBe(0);
    expect(a.diff(b, 'day')).toBe(-100);
    expect(a.diff(a.add(1, 'year'), 'year', true)).toBe(-1);
    expect(a.diff(a, 'month', true)).toBe(0);
    expect(a.diff(dayjs.hijri('bad'), 'month')).toBeNaN();
    expect(dayjs.hijri('bad').diff(a, 'year')).toBeNaN();
  });

  it('does not turn unavailable interpolation anchors into a zero difference', () => {
    expect(
      dayjs.hijri('1343-01-02').diff(dayjs.hijri('1343-01-01'), 'month', true),
    ).toBeGreaterThan(0);
  });
});

it('provides typed public API and rejects invalid calendar names at runtime', () => {
  expectTypeOf(dayjs.hijri('1446-07-07')).toEqualTypeOf<dayjs.Dayjs>();
  expectTypeOf(dayjs().calendar()).toEqualTypeOf<Calendar>();
  expectTypeOf(gregorianToHijri(2025, 1, 7)).toEqualTypeOf<HijriDate>();
  // @ts-expect-error Calendar is a closed union.
  expect(() => dayjs.calendar('invalid')).toThrow(RangeError);
  // @ts-expect-error Calendar is a closed union.
  expect(() => dayjs().calendar('invalid')).toThrow(RangeError);
});
