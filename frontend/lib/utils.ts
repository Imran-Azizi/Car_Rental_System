/**
 * Format a date/datetime in Afghanistan Shamsi (Solar Hijri) calendar
 * with English/Latin digits (nu-latn).
 * showTime=true appends HH:mm in 24-hour format.
 */
export function formatAfghanDate(
  date: string | Date | null | undefined,
  showTime = false,
): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(showTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  };
  // ca-persian = Solar Hijri (Shamsi); nu-latn = Latin/English numerals
  return new Intl.DateTimeFormat("fa-AF-u-ca-persian-nu-latn", opts).format(d);
}

const afghanCalendarFormatter = new Intl.DateTimeFormat(
  "fa-AF-u-ca-persian-nu-latn",
  {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
);

function getAfghanDatePartsFromDate(date: Date) {
  const parts = afghanCalendarFormatter.formatToParts(date);
  const result = { year: "", month: "", day: "" };
  parts.forEach((part) => {
    if (part.type === "year") result.year = toEnglishNums(part.value);
    if (part.type === "month") result.month = toEnglishNums(part.value);
    if (part.type === "day") result.day = toEnglishNums(part.value);
  });
  return result;
}

export function gregorianToAfghanParts(date: string | Date | null | undefined) {
  if (!date) return { year: "", month: "", day: "" };
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return { year: "", month: "", day: "" };
  return getAfghanDatePartsFromDate(d);
}

export function shamsiToGregorianIso(year: string, month: string, day: string) {
  const jYear = Number(toEnglishNums(String(year)));
  const jMonth = Number(toEnglishNums(String(month)));
  const jDay = Number(toEnglishNums(String(day)));
  if (!jYear || !jMonth || !jDay) return "";

  const targetYear = String(jYear).padStart(4, "0");
  const targetMonth = String(jMonth).padStart(2, "0");
  const targetDay = String(jDay).padStart(2, "0");

  const approxGregorianYear = jYear + 621;
  const start = new Date(Date.UTC(approxGregorianYear - 2, 0, 1));
  const end = new Date(Date.UTC(approxGregorianYear + 2, 11, 31));

  for (
    let dt = new Date(start);
    dt <= end;
    dt.setUTCDate(dt.getUTCDate() + 1)
  ) {
    const parts = getAfghanDatePartsFromDate(new Date(dt));
    if (
      parts.year === targetYear &&
      parts.month === targetMonth &&
      parts.day === targetDay
    ) {
      return dt.toISOString().slice(0, 10);
    }
  }

  return "";
}

export function getAfghanDaysInMonth(
  year: string | number,
  month: string | number,
) {
  const jYear = Number(toEnglishNums(String(year)));
  const jMonth = Number(toEnglishNums(String(month)));
  if (!jYear || !jMonth) return 31;

  if (jMonth <= 6) return 31;
  if (jMonth <= 11) return 30;

  return shamsiToGregorianIso(jYear.toString(), "12", "30") ? 30 : 29;
}

/** Convert Persian/Dari (۰-۹) and Arabic-Indic (٠-٩) numerals to ASCII digits */
export function toEnglishNums(str: string): string {
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/** Parse a possibly-Persian/Dari numeric string to a float */
export function parseNum(str: string | number): number {
  if (typeof str === "number") return str;
  const english = toEnglishNums(String(str)).replace(/[^0-9.]/g, "");
  return parseFloat(english) || 0;
}

/** Format a number with English digits and thousands separators — no currency symbol */
export function formatNumber(amount: number | string | undefined): string {
  const n = typeof amount === "number" ? amount : parseNum(String(amount ?? 0));
  return Math.round(n).toLocaleString("en-US");
}

/** Format a number as Afghan currency with English digits: "1,500 ؋" */
export function formatCurrency(
  amount: number | string | undefined,
  suffix = "؋",
): string {
  return `${formatNumber(amount)} ${suffix}`;
}

/** onChange handler for a numeric text input — converts Persian/Dari digits to English */
export function numericInputHandler(
  setValue: (v: string) => void,
  allowDecimal = true,
) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = toEnglishNums(e.target.value);
    const cleaned = allowDecimal
      ? raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
      : raw.replace(/[^0-9]/g, "");
    setValue(cleaned);
  };
}

/** Returns { onChange, onPaste } props for a numeric input — handles paste of Dari digits */
export function numericInputProps(
  setValue: (v: string) => void,
  allowDecimal = true,
) {
  const clean = (v: string) => {
    const eng = toEnglishNums(v);
    return allowDecimal
      ? eng.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
      : eng.replace(/[^0-9]/g, "");
  };
  return {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(clean(e.target.value)),
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      setValue(clean(e.clipboardData.getData("text")));
    },
  };
}
