/**
 * Persian / Jalali Solar Calendar Utilities
 * Accurate Gregorian <-> Jalali conversions
 */

export interface JalaliDate {
  jy: number;
  jm: number; // 1-12
  jd: number; // 1-31
}

export interface GregorianDate {
  gy: number;
  gm: number; // 1-12
  gd: number; // 1-31
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEKDAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const PERSIAN_DIGITS_MAP: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',
};

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (w) => PERSIAN_DIGITS_MAP[w] || w);
}

export function isJalaliLeapYear(jy: number): boolean {
  // Approximate algorithm for Jalali leap years
  const r = (jy - 474) % 2820;
  return ((r + 474 + 38) * 682) % 2816 < 682;
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * Converts Gregorian Date to Jalali Date
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd;
  for (let i = 0; i < gm; ++i) days += g_d_m[i];

  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { jy, jm, jd };
}

/**
 * Converts Jalali Date to Gregorian Date
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  let gy = jy + 621;
  let days = -355668 + (365 * jy) + Math.floor(Math.floor(jy / 33) * 8) + Math.floor((jy % 33 + 3) / 4) + jd;
  if (jm < 7) {
    days += (jm - 1) * 31;
  } else {
    days += ((jm - 7) * 30) + 186;
  }

  let gd: number;
  let gm: number;

  const g_d_m = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let v = days + 355668;
  const d = new Date(Date.UTC(621, 2, 21));
  d.setUTCDate(d.getUTCDate() + (days + 355668 - 355668));
  
  // Clean date parsing via timestamp
  // Reference epoch: 1 Farvardin 1 Jalali = March 21, 622 AD
  const jDaysSinceEpoch = days;
  // Use pure JS Date addition from known reference:
  // 1403/01/01 is 2024-03-20 or 2024-03-21
  // Let's use direct algebraic computation:
  let sal_a = jy - 979;
  let sal_b = jm - 1;
  let sal_c = jd - 1;
  let interval = 365 * sal_a + Math.floor(sal_a / 33) * 8 + Math.floor((sal_a % 33 + 3) / 4);
  interval += sal_b < 6 ? sal_b * 31 : (sal_b - 6) * 30 + 186;
  interval += sal_c;

  let g_interval = interval + 79;
  let g_y = 1600 + 400 * Math.floor(g_interval / 146097);
  let g_rem = g_interval % 146097;

  let leap = true;
  if (g_rem >= 36525) {
    g_rem--;
    g_y += 100 * Math.floor(g_rem / 36524);
    g_rem = g_rem % 36524;
    if (g_rem >= 365) {
      g_rem++;
    } else {
      leap = false;
    }
  }

  g_y += 4 * Math.floor(g_rem / 1461);
  g_rem %= 1461;

  if (g_rem >= 366) {
    leap = false;
    g_rem--;
    g_y += Math.floor(g_rem / 365);
    g_rem = g_rem % 365;
  }

  const g_days_in_month = [31, (g_y % 4 === 0 && g_y % 100 !== 0) || (g_y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let g_m = 0;
  for (let i = 0; i < 12; i++) {
    if (g_rem < g_days_in_month[i]) {
      g_m = i + 1;
      gd = g_rem + 1;
      break;
    }
    g_rem -= g_days_in_month[i];
  }

  return { gy: g_y, gm: g_m, gd: gd! };
}

/**
 * Returns today's Jalali date object
 */
export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Formats a JS Date or YYYY-MM-DD string to Jalali representation
 */
export function formatToJalali(
  dateInput?: string | Date | null,
  format: 'full' | 'short' | 'month_year' | 'date_only' | 'weekday_date' = 'full',
  usePersianDigits = true
): string {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    // If it's already YYYY-MM-DD
    const parts = dateInput.split('T')[0].split('-');
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) {
    d = new Date();
  }

  const jDate = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  
  // Persian day of week (Saturday is 0, Sunday 1, ... Friday 6)
  // JS getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const jsDay = d.getDay();
  const persianDayIdx = (jsDay + 1) % 7; // Sat=0, Sun=1...
  const weekdayName = PERSIAN_WEEKDAY_NAMES[persianDayIdx];
  const monthName = PERSIAN_MONTH_NAMES[jDate.jm - 1];

  let result = '';

  switch (format) {
    case 'full':
      result = `${weekdayName} ${jDate.jd} ${monthName} ${jDate.jy}`;
      break;
    case 'weekday_date':
      result = `${weekdayName} ${jDate.jd} ${monthName}`;
      break;
    case 'short':
      result = `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
      break;
    case 'month_year':
      result = `${monthName} ${jDate.jy}`;
      break;
    case 'date_only':
      result = `${jDate.jd} ${monthName}`;
      break;
  }

  return usePersianDigits ? toPersianDigits(result) : result;
}

/**
 * Converts ISO/Date to YYYY-MM-DD Gregorian string
 */
export function toGregorianIsoDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets day index in Persian week (0=Saturday ... 6=Friday) from Date
 */
export function getPersianDayIndex(d: Date = new Date()): number {
  return (d.getDay() + 1) % 7;
}

/**
 * Generates array of days for a given Jalali month (with empty padding for Saturday start)
 */
export function getJalaliMonthMatrix(jy: number, jm: number): {
  daysInMonth: number;
  startWeekdayIdx: number; // 0=Sat, 6=Fri
  days: {
    jy: number;
    jm: number;
    jd: number;
    gregorianDateStr: string;
    isCurrentMonth: boolean;
  }[];
} {
  const daysInMonth = getJalaliMonthDays(jy, jm);
  // Get Gregorian date for 1st day of this Jalali month
  const firstDayGreg = jalaliToGregorian(jy, jm, 1);
  const firstDate = new Date(firstDayGreg.gy, firstDayGreg.gm - 1, firstDayGreg.gd);
  const startWeekdayIdx = (firstDate.getDay() + 1) % 7; // 0 = شنبه

  const days: {
    jy: number;
    jm: number;
    jd: number;
    gregorianDateStr: string;
    isCurrentMonth: boolean;
  }[] = [];

  // Previous month padding
  const prevMonth = jm === 1 ? 12 : jm - 1;
  const prevYear = jm === 1 ? jy - 1 : jy;
  const prevMonthDays = getJalaliMonthDays(prevYear, prevMonth);

  for (let i = startWeekdayIdx - 1; i >= 0; i--) {
    const pjd = prevMonthDays - i;
    const g = jalaliToGregorian(prevYear, prevMonth, pjd);
    days.push({
      jy: prevYear,
      jm: prevMonth,
      jd: pjd,
      gregorianDateStr: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const g = jalaliToGregorian(jy, jm, d);
    days.push({
      jy,
      jm,
      jd: d,
      gregorianDateStr: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill out rows of 7
  const remaining = (7 - (days.length % 7)) % 7;
  const nextMonth = jm === 12 ? 1 : jm + 1;
  const nextYear = jm === 12 ? jy + 1 : jy;

  for (let d = 1; d <= remaining; d++) {
    const g = jalaliToGregorian(nextYear, nextMonth, d);
    days.push({
      jy: nextYear,
      jm: nextMonth,
      jd: d,
      gregorianDateStr: `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  return {
    daysInMonth,
    startWeekdayIdx,
    days,
  };
}

/**
 * Returns the current 7 days of the Persian week starting from Saturday
 */
export function getCurrentPersianWeekDays(refDate: Date = new Date()): {
  date: Date;
  isoDate: string;
  jalali: JalaliDate;
  weekdayName: string;
  weekdayShort: string;
  dayIndex: number;
}[] {
  const currentPersianDayIdx = (refDate.getDay() + 1) % 7; // 0=Sat
  const weekStart = new Date(refDate);
  weekStart.setDate(refDate.getDate() - currentPersianDayIdx);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    days.push({
      date: d,
      isoDate: toGregorianIsoDate(d),
      jalali: j,
      weekdayName: PERSIAN_WEEKDAY_NAMES[i],
      weekdayShort: PERSIAN_WEEKDAY_SHORT[i],
      dayIndex: i,
    });
  }
  return days;
}
