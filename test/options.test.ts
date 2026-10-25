import dayjs from 'dayjs';
import { expect, it } from 'vitest';
import hijri from '../src/index.js';

dayjs.extend(hijri, { weekStart: 1 });

it('allows explicit Hijri week configuration', () => {
  const value = dayjs.hijri('1446-07-07');
  expect(value.startOf('week').day()).toBe(1);
  expect(value.endOf('week').day()).toBe(0);
  expect(value.startOf('week').format('HH:mm:ss.SSS')).toBe('00:00:00.000');
  expect(value.endOf('week').format('HH:mm:ss.SSS')).toBe('23:59:59.999');
});
