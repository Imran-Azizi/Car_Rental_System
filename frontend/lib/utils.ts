/**
 * Format a date/datetime in Afghanistan Shamsi (Solar Hijri) calendar
 * with English/Latin digits (nu-latn).
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
  // ca-persian = Solar Hijri (Shamsi); nu-latn = Latin/English numerals
  return new Intl.DateTimeFormat('fa-AF-u-ca-persian-nu-latn', opts).format(d);
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

/** Format a number with English digits and thousands separators — no currency symbol */
export function formatNumber(amount: number | string | undefined): string {
  const n = typeof amount === 'number' ? amount : parseNum(String(amount ?? 0));
  return Math.round(n).toLocaleString('en-US');
}

/** Format a number as Afghan currency with English digits: "1,500 ؋" */
export function formatCurrency(amount: number | string | undefined, suffix = '؋'): string {
  return `${formatNumber(amount)} ${suffix}`;
}

/** onChange handler for a numeric text input — converts Persian/Dari digits to English */
export function numericInputHandler(setValue: (v: string) => void, allowDecimal = true) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishNums(e.target.value);
    const cleaned = allowDecimal
      ? raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
      : raw.replace(/[^0-9]/g, '');
    setValue(cleaned);
  };
}

/** Returns { onChange, onPaste } props for a numeric input — handles paste of Dari digits */
export function numericInputProps(setValue: (v: string) => void, allowDecimal = true) {
  const clean = (v: string) => {
    const eng = toEnglishNums(v);
    return allowDecimal
      ? eng.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
      : eng.replace(/[^0-9]/g, '');
  };
  return {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(clean(e.target.value)),
    onPaste:  (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      setValue(clean(e.clipboardData.getData('text')));
    },
  };
}
