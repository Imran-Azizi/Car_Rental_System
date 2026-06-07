const KABUL_TIMEZONE = "Asia/Kabul";

const staticFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: KABUL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getKabulDateTimeParts(date) {
  const parts = staticFormatter.formatToParts(date);
  const result = {
    year: "0000",
    month: "01",
    day: "01",
    hour: "00",
    minute: "00",
    second: "00",
  };
  parts.forEach((part) => {
    if (part.type in result) result[part.type] = part.value;
  });
  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
    hour: Number(result.hour),
    minute: Number(result.minute),
    second: Number(result.second),
  };
}

function toKabulUtcDate({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
}) {
  const targetUtcMillis = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  const testDate = new Date(targetUtcMillis);
  const localParts = getKabulDateTimeParts(testDate);
  const localUtcMillis = Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    localParts.second,
  );
  const offset = localUtcMillis - targetUtcMillis;
  return new Date(targetUtcMillis - offset);
}

function parseKabulDateString(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return toKabulUtcDate({
    year,
    month,
    day,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
}

function parseKabulDateTimeString(dateString, timeString = "00:00") {
  if (!dateString || typeof dateString !== "string") return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  const [hour = "0", minute = "0", second = "0"] = timeString.split(":");
  return toKabulUtcDate({
    year,
    month,
    day,
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: 0,
  });
}

function startOfKabulDay(dateString) {
  return parseKabulDateString(dateString);
}

function endOfKabulDay(dateString) {
  const start = parseKabulDateString(dateString);
  if (!start) return null;
  const end = new Date(start.getTime());
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function getKabulMonthRangeForDate(date = new Date()) {
  const parts = getKabulDateTimeParts(date);
  const start = toKabulUtcDate({
    year: parts.year,
    month: parts.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  const nextMonthStart = toKabulUtcDate({
    year: parts.year,
    month: parts.month + 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  return { start, end: new Date(nextMonthStart.getTime() - 1) };
}

function addKabulMonths(date = new Date(), months = 0) {
  const parts = getKabulDateTimeParts(date);
  return toKabulUtcDate({
    year: parts.year,
    month: parts.month + months,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
}

function getKabulMonthRange(year, month) {
  if (!year || !month) return null;
  const start = toKabulUtcDate({
    year,
    month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  const nextMonthStart = toKabulUtcDate({
    year,
    month: month + 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  return { start, end: new Date(nextMonthStart.getTime() - 1) };
}

function parseKabulMonth(monthString) {
  if (!monthString || typeof monthString !== "string") return null;
  const [year, month] = monthString.split("-").map(Number);
  if (!year || !month) return null;
  return getKabulMonthRange(year, month);
}

function parseKabulFilterRange({ dateFrom, dateTo, month }) {
  const range = {};
  if (month) {
    const monthRange = parseKabulMonth(month);
    if (monthRange) {
      range.gte = monthRange.start;
      range.lte = monthRange.end;
      return range;
    }
  }
  if (dateFrom) {
    const start = startOfKabulDay(dateFrom);
    if (start) range.gte = start;
  }
  if (dateTo) {
    const end = endOfKabulDay(dateTo);
    if (end) range.lte = end;
  }
  return range;
}

function formatKabulIso(dateOrString = new Date()) {
  const date =
    typeof dateOrString === "string" ? new Date(dateOrString) : dateOrString;
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KABUL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const result = { year: "", month: "", day: "" };
  parts.forEach((part) => {
    if (part.type in result) result[part.type] = part.value;
  });
  return `${result.year}-${result.month}-${result.day}`;
}

export {
  KABUL_TIMEZONE,
  getKabulDateTimeParts,
  toKabulUtcDate,
  parseKabulDateString,
  parseKabulDateTimeString,
  startOfKabulDay,
  endOfKabulDay,
  getKabulMonthRangeForDate,
  addKabulMonths,
  getKabulMonthRange,
  parseKabulMonth,
  parseKabulFilterRange,
  formatKabulIso,
};
