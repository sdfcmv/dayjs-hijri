import type dayjsFactory from 'dayjs';
import type { Dayjs as DayjsInstance } from 'dayjs';

export type Calendar = 'gregory' | 'hijri';

export interface HijriConfig {
  /** Parse the input string as a Hijri date; independent of the display calendar. */
  readonly hijri?: boolean;
  readonly calendar?: Calendar;
  readonly locale?: string;
  /** Requires the Day.js UTC plugin. */
  readonly utc?: boolean;
}

export interface HijriPluginOptions {
  /** First day of Hijri weeks: 0 = Sunday, 6 = Saturday (default). */
  readonly weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

declare module 'dayjs' {
  interface FormatObject {
    hijri?: boolean;
    calendar?: Calendar;
  }

  /** Parse Hijri input and display it in the Hijri calendar by default. */
  function hijri(
    input: string,
    config?: Omit<HijriConfig, 'hijri'>,
  ): DayjsInstance;

  /** Set the display calendar for subsequently created instances. */
  function calendar(calendar: Calendar): typeof dayjsFactory;

  interface Dayjs {
    calendar(): Calendar;
    /** Return a clone using the selected display calendar, preserving its instant. */
    calendar(calendar: Calendar): DayjsInstance;
    isHijri(): boolean;
  }
}
