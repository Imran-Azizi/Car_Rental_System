/**
 * Format a date/datetime in Afghanistan Shamsi (Solar Hijri) calendar.
 * Uses Asia/Kabul timezone and fa-AF locale so digits are Eastern Arabic.
 * showTime=true appends HH:mm in 24-hour format.
 */
export function formatAfghanDate(date: string | Date | null | undefined, showTime = false): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kabul',
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
    ...(showTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  };
  return new Intl.DateTimeFormat('fa-AF-u-ca-persian', opts).format(d);
}

/** Convert Persian/Dari (۰-۹) and Arabic-Indic (٠-٩) numerals to ASCII digits */
export function toEnglishNums(str: string): string {
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/** Parse a possibly-Persian/Dari numeric string to a float */
export function parseNum(str: string | number): number {
  if (typeof str === 'number') return str;
  const english = toEnglishNums(String(str)).replace(/[^0-9.]/g, '');
  return parseFloat(english) || 0;
}

/** Handle change for a numeric text input:
 *  - accepts Persian/Dari digits
 *  - converts to English digits in-place
 *  - calls setValue with the cleaned string */
export function numericInputHandler(setValue: (v: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishNums(e.target.value).replace(/[^0-9.]/g, '');
    setValue(cleaned);
  };
}
