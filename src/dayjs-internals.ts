import type { ConfigType, Dayjs, UnitType } from 'dayjs';
import type { HijriConfig } from './types.js';

/**
 * Day.js exposes parse and $set as plugin hooks at runtime but omits them from
 * its public declarations. Keep that integration boundary here; never augment
 * the public Dayjs type with private fields or use untyped prototype access.
 */
export interface DayjsInternals extends Dayjs {
  $d: Date;
  $u?: boolean;
  $x: { hijriCalendar?: HijriConfig['calendar']; [key: string]: unknown };
  parse(config: ParseConfig): void;
  init(): void;
  $set(unit: UnitType, value: number): Dayjs;
}

/** Optional hooks are accessed separately so other plugins' augmentations merge safely. */
export interface OptionalPluginHooks {
  utc?: (this: Dayjs, keepLocalTime?: boolean) => Dayjs;
  local?: (this: Dayjs) => Dayjs;
  toArray?: (this: Dayjs) => number[];
}

export interface ParseConfig extends HijriConfig {
  date?: ConfigType;
  x?: DayjsInternals['$x'];
}

/** The sole cast from the documented public type to the runtime plugin hooks. */
export function internal(instance: Dayjs): DayjsInternals {
  return instance as DayjsInternals;
}

export function optionalHooks(instance: Dayjs): OptionalPluginHooks {
  const runtime: unknown = instance;
  return runtime as OptionalPluginHooks;
}
