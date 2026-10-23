import type { DailyEntry, PartnerState, SavedPlace, SettingsState } from "@/lib/types";

export type AppData = {
  entries: Record<string, DailyEntry>;
  places: SavedPlace[];
  partner: PartnerState;
  settings: SettingsState;
};

export type BackupFile = {
  app: "one-step-closer";
  formatVersion: 1;
  exportedAt: string;
  data: AppData;
};

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

function fail(message: string): never {
  throw new Error(message);
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${label}格式不正确，无法恢复。`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(`${label}必须是普通数据对象。`);
  }
  return value as Record<string, unknown>;
}

function exactObject(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  const result = object(value, label);
  const actual = Object.keys(result);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) {
    fail(`${label}包含缺少或无法识别的字段；为避免丢失内容，已停止操作。`);
  }
  return result;
}

function string(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string") fail(`${label}必须是文字。`);
}

function boolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== "boolean") fail(`${label}状态不正确。`);
}

function choice(value: unknown, options: readonly unknown[], label: string): void {
  if (!options.includes(value)) fail(`${label}包含不支持的选项。`);
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthDays[month - 1];
}

function timestamp(value: unknown, label: string): void {
  string(value, label);
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match || !isCalendarDate(match[1]) || Number(match[2]) > 23 || Number(match[3]) > 59 ||
    Number(match[4]) > 59 || (match[5] && (Number(match[6]) > 23 || Number(match[7]) > 59)) ||
    !Number.isFinite(Date.parse(value))) {
    fail(`${label}必须是包含时区的有效 ISO 日期时间。`);
  }
}

function validateData(value: unknown): asserts value is AppData {
  const data = exactObject(value, ["entries", "places", "partner", "settings"], "备份数据");
  const entries = object(data.entries, "每日记录");
  for (const [date, value] of Object.entries(entries)) {
    if (!isCalendarDate(date)) fail("每日记录包含无效日期。");
    const entry = exactObject(value, ["date", "foodStatus", "salah", "quran", "reflection"], "每日记录");
    if (entry.date !== date) fail("每日记录的日期与索引不一致。");
    choice(entry.foodStatus, [null, "halal", "vegetarian_seafood", "unsure", "not_halal"], "饮食记录");
    choice(entry.quran, [null, "none", "translation", "tafsir", "listened", "five_minutes"], "Qur'an 记录");
    string(entry.reflection, "感想");
    const prayers = exactObject(entry.salah, ["fajr", "dhuhr", "asr", "maghrib", "isha"], "礼拜记录");
    for (const prayer of Object.values(prayers)) boolean(prayer, "礼拜");
  }

  if (!Array.isArray(data.places)) fail("地点列表格式不正确。");
  const ids = new Set<string>();
  for (const value of data.places) {
    const place = exactObject(value, ["id", "name", "type", "location", "notes", "favorite", "createdAt"], "地点");
    for (const key of ["id", "name", "location", "notes"]) string(place[key], "地点文字");
    const id = place.id as string;
    if (!id.trim() || ids.has(id)) fail("地点标识为空或重复，无法安全恢复。");
    ids.add(id);
    choice(place.type, ["restaurant", "grocery", "vegetarian_option", "other"], "地点类型");
    boolean(place.favorite, "地点收藏");
    timestamp(place.createdAt, "地点创建时间");
  }

  const partner = exactObject(data.partner, ["personOne", "personTwo", "weeklyGoal", "completedThisWeek", "note", "updatedAt"], "同行记录");
  for (const key of ["personOne", "personTwo", "note"]) string(partner[key], "同行记录文字");
  choice(partner.weeklyGoal, [null, "eat_halal_together", "try_new_halal_place", "cook_halal_meal", "avoid_active_non_halal"], "同行目标");
  boolean(partner.completedThisWeek, "同行目标完成");
  if (partner.updatedAt !== null) timestamp(partner.updatedAt, "同行记录更新时间");

  const settings = exactObject(data.settings, ["appName", "mainFocus", "reminderText", "theme"], "设置");
  string(settings.appName, "应用名称");
  string(settings.reminderText, "提醒文字");
  choice(settings.mainFocus, ["food", "salah", "quran", "balanced"], "主要关注");
  choice(settings.theme, ["warm", "green", "minimal"], "主题");
}

function validateBackup(value: unknown): asserts value is BackupFile {
  const file = exactObject(value, ["app", "formatVersion", "exportedAt", "data"], "备份文件");
  if (file.app !== "one-step-closer") fail("这不是 One Step Closer 的备份文件。");
  if (file.formatVersion !== 1) fail("不支持此备份版本，请使用兼容的应用版本打开。");
  timestamp(file.exportedAt, "备份导出时间");
  validateData(file.data);
}

function checkSize(text: string): void {
  // Count the actual UTF-8 download size, including Chinese and emoji.
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    fail("备份文件大小超过 2 MiB，已停止操作，原记录未修改。");
  }
}

export function parseBackup(text: string): BackupFile {
  checkSize(text);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    fail("无法读取备份文件：内容不是完整有效的 JSON。");
  }
  validateBackup(value);
  return value;
}

export function createBackup(data: AppData, exportedAt = new Date().toISOString()): BackupFile {
  const file = { app: "one-step-closer", formatVersion: 1, exportedAt, data };
  // Validate before serialization: JSON.stringify would otherwise silently omit
  // unsupported undefined properties supplied by existing application data.
  validateBackup(file);
  // Return an independent snapshot and guarantee it passes the import boundary.
  return parseBackup(JSON.stringify(file));
}

export function summarizeData(data: AppData): { entryCount: number; placeCount: number; dateRange: string | null } {
  const dates = Object.keys(data.entries).sort();
  return { entryCount: dates.length, placeCount: data.places.length, dateRange: dates.length ? `${dates[0]} — ${dates[dates.length - 1]}` : null };
}
