export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatChineseDate(dateKey: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(parseDateKey(dateKey));
}

export function getWeekDateKeys(reference = new Date()) {
  const date = new Date(reference);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return getTodayKey(next);
  });
}

export function isSameWeek(timestamp: string | null, reference: Date) {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  return getWeekDateKeys(date)[0] === getWeekDateKeys(reference)[0];
}

export function formatWeekRange(dateKeys: string[]) {
  if (dateKeys.length === 0) {
    return "";
  }

  const first = parseDateKey(dateKeys[0]);
  const last = parseDateKey(dateKeys[dateKeys.length - 1]);
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric"
  });

  return `${formatter.format(first)} - ${formatter.format(last)}`;
}
