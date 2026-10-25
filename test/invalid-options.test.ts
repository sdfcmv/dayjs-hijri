import dayjs from 'dayjs';
import { expect, it } from 'vitest';
import hijri from '../src/index.js';

it('rejects malformed configuration received from JavaScript', () => {
  // @ts-expect-error Weekday values are restricted to 0–6.
  expect(() => dayjs.extend(hijri, { weekStart: 7 })).toThrow(RangeError);
});
