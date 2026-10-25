export const EN_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
] as const;
export const EN_MONTHS_SHORT = [
  'Muh',
  'Saf',
  'Rab-I',
  'Rab-II',
  'Jum-I',
  'Jum-II',
  'Raj',
  'Sha',
  'Ram',
  'Shw',
  'Dhu-Q',
  'Dhu-H',
] as const;
export const AR_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;
export const AR_MONTHS_SHORT = [
  'محرم',
  'صفر',
  'ربيع ١',
  'ربيع ٢',
  'جمادى ١',
  'جمادى ٢',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;
export const DV_MONTHS = [
  'މުޙައްރަމް',
  'ޞަފަރު',
  'ރަބީޢުލް އައްވަލް',
  'ރަބީޢުލް އާޚިރު',
  'ޖުމާދަލް އައްވަލް',
  'ޖުމާދަލް އާޚިރާ',
  'ރަޖަބު',
  'ޝަޢުބާން',
  'ރަމަޟާން',
  'ޝައްވާލް',
  'ޛުލްޤަޢިދާ',
  'ޛުލްޙިއްޖާ',
] as const;

export function monthName(
  month: number,
  locale: string,
  short: boolean,
): string {
  const language = locale.split('-')[0];
  // As in Day.js's Dhivehi locale, short names retain the full spelling.
  if (language === 'dv') return DV_MONTHS[month - 1] ?? '';
  const arabic = language === 'ar';
  const names = arabic
    ? short
      ? AR_MONTHS_SHORT
      : AR_MONTHS
    : short
      ? EN_MONTHS_SHORT
      : EN_MONTHS;
  return names[month - 1] ?? '';
}
