export { default } from './plugin.js';
export {
  gregorianToHijri,
  hijriToGregorian,
  hijriDaysInMonth,
} from './calendar/conversion.js';
export type { CalendarDate, HijriDate } from './calendar/conversion.js';
export type { Calendar, HijriConfig, HijriPluginOptions } from './types.js';
