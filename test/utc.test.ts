import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import toArray from 'dayjs/plugin/toArray.js';
import weekday from 'dayjs/plugin/weekday.js';
import { describe, expect, it } from 'vitest';
import hijri from '../src/index.js';

dayjs.extend(utc);
dayjs.extend(toArray);
dayjs.extend(weekday);
dayjs.extend(hijri);

describe('UTC and official plugin integration', () => {
  it('reads UTC civil fields rather than the host timezone', () => {
    const value = dayjs.utc('2025-01-07T23:34:56.789Z').calendar('hijri');
    expect(value.isUTC()).toBe(true);
    expect(value.format()).toBe('1446-07-07T23:34:56Z');
    expect(value.toISOString()).toBe('2025-01-07T23:34:56.789Z');
    expect(value.toArray()).toEqual([1446, 6, 7, 23, 34, 56, 789]);
    expect(value.calendar('gregory').toArray()).toEqual([
      2025, 0, 7, 23, 34, 56, 789,
    ]);
    expect(value.weekday()).toBe(2);
  });

  it('parses directly into UTC without a local-time detour', () => {
    const value = dayjs.hijri('1446-07-07T00:00:00.001', { utc: true });
    expect(value.isUTC()).toBe(true);
    expect(value.toISOString()).toBe('2025-01-07T00:00:00.001Z');
    expect(value.format()).toBe('1446-07-07T00:00:00Z');
  });

  it('preserves UTC through clone, arithmetic, setters, and exact boundaries', () => {
    const value = dayjs.hijri('1446-07-30T22:33:44.555', { utc: true });
    for (const result of [
      value.clone(),
      dayjs(value),
      value.add(1, 'day'),
      value.add(1, 'month'),
      value.year(1447),
      value.date(1),
      value.hour(4),
      value.startOf('month'),
      value.endOf('year'),
    ]) {
      expect(result.isUTC()).toBe(true);
      expect(result.calendar()).toBe('hijri');
    }
    expect(value.add(1, 'month').format('YYYY-MM-DD HH:mm:ss.SSS')).toBe(
      '1446-08-29 22:33:44.555',
    );
    expect(value.startOf('month').toISOString()).toBe(
      '2025-01-01T00:00:00.000Z',
    );
    expect(value.endOf('month').toISOString()).toBe('2025-01-30T23:59:59.999Z');
    expect(value.add(1, 'day').date()).toBe(1);
  });

  it('keeps display choice and timestamp during UTC/local conversion', () => {
    const value = dayjs.hijri('1446-07-07T12:34:56', { utc: true });
    const local = value.local();
    expect(local.calendar()).toBe('hijri');
    expect(local.isUTC()).toBe(false);
    expect(local.valueOf()).toBe(value.valueOf());
    expect(local.utc().calendar()).toBe('hijri');
    expect(local.utc().valueOf()).toBe(value.valueOf());
    expect(local.utc(true).calendar()).toBe('hijri');
    expect(local.utc(true).hour()).toBe(local.hour());
  });

  it('handles fixed offsets without formatting Hijri dates back into Gregorian parsers', () => {
    const value = dayjs
      .utc('2025-01-07T22:34:56.789Z')
      .utcOffset(300)
      .calendar('hijri');
    expect(value.format('YYYY-MM-DD HH:mm:ss Z')).toBe(
      '1446-07-08 03:34:56 +05:00',
    );
    expect(value.clone().valueOf()).toBe(value.valueOf());
    expect(value.startOf('day').format('YYYY-MM-DD HH:mm:ss.SSS Z')).toBe(
      '1446-07-08 00:00:00.000 +05:00',
    );
    expect(value.endOf('month').format('YYYY-MM-DD HH:mm:ss.SSS Z')).toBe(
      '1446-07-30 23:59:59.999 +05:00',
    );
    expect(value.add(1, 'month').utcOffset()).toBe(300);
    expect(value.date(2).format('YYYY-MM-DD HH:mm:ss.SSS Z')).toBe(
      '1446-07-02 03:34:56.789 +05:00',
    );
    expect(value.diff(value.add(1, 'month'), 'month', true)).toBe(-1);
  });

  it('preserves leap-day instants and time-based differences', () => {
    const value = dayjs.utc('2024-02-29T23:00:00Z').calendar('hijri');
    expect(value.calendar('gregory').toISOString()).toBe(
      '2024-02-29T23:00:00.000Z',
    );
    expect(value.add(2, 'hour').diff(value, 'hour')).toBe(2);
    expect(value.diff(value.calendar('gregory'), 'millisecond')).toBe(0);
  });
});
