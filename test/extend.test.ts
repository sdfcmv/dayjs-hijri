import dayjs from 'dayjs';
import { expect, it } from 'vitest';
import hijri from '../src/index.js';

const existing = dayjs('2025-01-31T14:15:16.017');
const before = {
  instant: existing.valueOf(),
  formatted: existing.format(),
  tomorrow: existing.add(1, 'day').valueOf(),
  nextMonth: existing.add(1, 'month').valueOf(),
};
dayjs.extend(hijri);

it('preserves instances created before extension and their original Gregorian calendar', () => {
  expect(existing.valueOf()).toBe(before.instant);
  expect(existing.format()).toBe(before.formatted);
  expect(existing.add(1, 'day').valueOf()).toBe(before.tomorrow);
  expect(existing.add(1, 'month').valueOf()).toBe(before.nextMonth);
  expect(existing.calendar()).toBe('gregory');
  dayjs.calendar('hijri');
  expect(existing.clone().calendar()).toBe('gregory');
  expect(existing.clone().format()).toBe(before.formatted);
  expect(dayjs('2025-01-31').calendar()).toBe('hijri');
});
