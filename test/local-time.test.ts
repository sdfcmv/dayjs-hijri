import dayjs from 'dayjs';
import { expect, it } from 'vitest';
import hijri from '../src/index.js';

dayjs.extend(hijri);

it.each(['2025-03-08T12:34:56.789', '2025-11-01T12:34:56.789'])(
  'preserves local civil time across a potential DST change from %s',
  (input) => {
    const value = dayjs(input).calendar('hijri');
    const expected = new Date(input);
    expected.setDate(expected.getDate() + 1);
    const tomorrow = value.add(1, 'day');
    expect(tomorrow.valueOf()).toBe(expected.valueOf());
    expect(tomorrow.format('HH:mm:ss.SSS')).toBe('12:34:56.789');
    expect(tomorrow.diff(value, 'day', true)).toBe(1);
    expect(value.startOf('day').hour()).toBe(0);
    expect(value.endOf('day').format('HH:mm:ss.SSS')).toBe('23:59:59.999');
  },
);

it('sets Hijri civil dates atomically across Gregorian month lengths and leap days', () => {
  for (let offset = 0; offset < 366; offset++) {
    const value = dayjs('2024-01-01T14:15:16.017')
      .add(offset, 'day')
      .calendar('hijri');
    const tomorrow = value.date(value.date() + 1);
    const expected = value.toDate();
    expected.setDate(expected.getDate() + 1);
    expect(tomorrow.valueOf()).toBe(expected.valueOf());
    expect(tomorrow.date()).toBe(
      tomorrow.calendar('gregory').calendar('hijri').date(),
    );
  }
});
