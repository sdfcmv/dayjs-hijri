import { describe, expect, it } from 'vitest';
import {
  gregorianToHijri,
  hijriDaysInMonth,
  hijriToGregorian,
} from '../src/index.js';
import { MONTH_STARTS } from '../src/calendar/ummalqura.js';
import legacyStarts from './fixtures/legacy-month-starts.json';

describe('Umm al-Qura conversion', () => {
  it.each([
    [1924, 8, 1, 1343, 1, 1],
    [2025, 1, 7, 1446, 7, 7],
    [2024, 3, 11, 1445, 9, 1],
    [2077, 11, 16, 1500, 12, 30],
  ])('converts the reference date %i-%i-%i', (gy, gm, gd, hy, hm, hd) => {
    expect(gregorianToHijri(gy, gm, gd)).toMatchObject({
      year: hy,
      month: hm,
      day: hd,
    });
    expect(hijriToGregorian(hy, hm, hd)).toEqual({
      year: gy,
      month: gm,
      day: gd,
    });
  });

  it('matches all 1,896 legacy month references, with the documented upstream correction', () => {
    expect(legacyStarts).toHaveLength(1896);
    for (const row of legacyStarts) {
      const [hy, hm, gy, gm, gd] = row;
      if (
        hy === undefined ||
        hm === undefined ||
        gy === undefined ||
        gm === undefined ||
        gd === undefined
      ) {
        throw new Error('Malformed calendar reference.');
      }
      const reference = new Date(Date.UTC(gy, gm - 1, gd));
      if (hy === 1354 && hm === 12)
        reference.setUTCDate(reference.getUTCDate() - 1);
      expect(hijriToGregorian(hy, hm, 1)).toEqual({
        year: reference.getUTCFullYear(),
        month: reference.getUTCMonth() + 1,
        day: reference.getUTCDate(),
      });
    }
  });

  it('round-trips every one of the 55,991 supported civil days', () => {
    let checked = 0;
    for (let year = 1343; year <= 1500; year++) {
      for (let month = 1; month <= 12; month++) {
        const length = hijriDaysInMonth(year, month);
        for (let day = 1; day <= length; day++) {
          const gregorian = hijriToGregorian(year, month, day);
          expect(
            gregorianToHijri(gregorian.year, gregorian.month, gregorian.day),
          ).toEqual({ year, month, day, daysInMonth: length });
          checked++;
        }
      }
    }
    expect(checked).toBe(55991);
  });

  it('retains historical 28/31-day records and the final sentinel', () => {
    expect(MONTH_STARTS).toHaveLength(1897);
    expect(hijriDaysInMonth(1354, 11)).toBe(30);
    expect(hijriDaysInMonth(1354, 12)).toBe(29);
    const lengths = new Set(
      MONTH_STARTS.slice(1).map(
        (start, index) => start - (MONTH_STARTS[index] ?? NaN),
      ),
    );
    expect(lengths).toEqual(new Set([28, 29, 30, 31]));
    expect(hijriDaysInMonth(1500, 12)).toBe(30);
  });

  it.each([
    [1342, 12, 30],
    [1501, 1, 1],
    [1446, 0, 1],
    [1446, 13, 1],
    [1446, 5, 30],
    [1446, 1, 0],
    [1446, 1, -1],
    [NaN, 1, 1],
    [1446, Infinity, 1],
    [1446, 1, 1.5],
    [1446.2, 1, 1],
  ])('rejects invalid Hijri input %s/%s/%s', (year, month, day) => {
    expect(() => hijriToGregorian(year, month, day)).toThrow(RangeError);
  });

  it.each([
    [1924, 7, 31],
    [2077, 11, 17],
    [2025, 2, 29],
    [2024, 2, 30],
    [2025, 13, 1],
    [2025, 0, 1],
    [2025, 1, 0],
    [NaN, 1, 1],
    [2025, 1.5, 1],
    [2025, 1, Infinity],
    [2025, 1, -1],
  ])('rejects invalid Gregorian input %s/%s/%s', (year, month, day) => {
    expect(() => gregorianToHijri(year, month, day)).toThrow(RangeError);
  });
});
