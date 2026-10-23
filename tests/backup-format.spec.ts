import { expect, test } from "@playwright/test";
import { createBackup, MAX_BACKUP_BYTES, parseBackup, summarizeData, type AppData } from "../src/lib/backup";

function fixture(): AppData {
  return {
    entries: {
      "2024-02-29": {
        date: "2024-02-29", foodStatus: "halal",
        salah: { fajr: true, dhuhr: false, asr: false, maghrib: true, isha: false },
        quran: "listened", reflection: "虚构的中文记录，保留 🌱 和换行。\n第二行"
      },
      "2026-10-22": {
        date: "2026-10-22", foodStatus: null,
        salah: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        quran: null, reflection: ""
      }
    },
    places: [{
      id: "fictional-place", name: "测试餐厅", type: "restaurant", location: "虚构地点",
      notes: "仅测试", favorite: true, createdAt: "2026-10-21T10:20:30.123Z"
    }],
    partner: {
      personOne: "测试甲", personTwo: "测试乙", weeklyGoal: "cook_halal_meal",
      completedThisWeek: true, note: "虚构目标", updatedAt: "2026-10-22T11:22:33.000Z"
    },
    settings: { appName: "测试应用", mainFocus: "balanced", reminderText: "慢慢来", theme: "green" }
  };
}

function rawFile(data: unknown = fixture()) {
  return { app: "one-step-closer", formatVersion: 1, exportedAt: "2026-10-22T12:00:00.000Z", data };
}

test("a backup round trip preserves all four categories and Unicode without sharing mutable data", () => {
  const source = fixture();
  const file = createBackup(source, "2026-10-22T12:00:00.000Z");
  const restored = parseBackup(JSON.stringify(file));
  expect(restored).toEqual(rawFile());
  source.settings.appName = "Changed after export";
  source.entries["2024-02-29"].reflection = "Changed after export";
  expect(file.data.settings.appName).toBe("测试应用");
  expect(file.data.entries["2024-02-29"].reflection).toBe("虚构的中文记录，保留 🌱 和换行。\n第二行");
});

test("the summary counts every entry and sorts dates instead of depending on insertion order", () => {
  const data = fixture();
  data.entries = Object.fromEntries(Object.entries(data.entries).reverse());
  expect(summarizeData(data)).toEqual({ entryCount: 2, placeCount: 1, dateRange: "2024-02-29 — 2026-10-22" });
  expect(summarizeData({ ...data, entries: {}, places: [] })).toEqual({ entryCount: 0, placeCount: 0, dateRange: null });
});

test("empty records and optional null states remain valid rather than being invented during import", () => {
  const data = fixture();
  data.entries = {};
  data.places = [];
  data.partner.weeklyGoal = null;
  data.partner.updatedAt = null;
  expect(parseBackup(JSON.stringify(rawFile(data))).data).toEqual(data);
});

test("file timestamps may carry an explicit timezone but not an ambiguous local time", () => {
  const file = { ...rawFile(), exportedAt: "2026-10-22T20:00:00+08:00" };
  expect(parseBackup(JSON.stringify(file)).exportedAt).toBe("2026-10-22T20:00:00+08:00");
  expect(() => parseBackup(JSON.stringify({ ...file, exportedAt: "2026-10-22T20:00:00" }))).toThrow(/时间/);
});

test("untrusted text is preserved as inert data without executing or interpreting it", () => {
  const data = fixture();
  data.entries["2024-02-29"].reflection = '<script>fetch("https://invalid.example")</script> $(rm -rf example)';
  expect(parseBackup(JSON.stringify(rawFile(data))).data.entries["2024-02-29"].reflection).toBe(data.entries["2024-02-29"].reflection);
});

test("malformed JSON reports a readable error", () => {
  expect(() => parseBackup("{unfinished")).toThrow(/JSON|文件/);
});

test("oversized UTF-8 data is rejected before accepting a file whose character count looks smaller", () => {
  const text = " ".repeat(10) + "中".repeat(Math.floor(MAX_BACKUP_BYTES / 3) + 1);
  expect(text.length).toBeLessThan(MAX_BACKUP_BYTES);
  expect(() => parseBackup(text)).toThrow(/大小|2 MiB/);
});

test("export also enforces the import size limit instead of making an unusable backup", () => {
  const data = fixture();
  data.entries["2024-02-29"].reflection = "中".repeat(Math.floor(MAX_BACKUP_BYTES / 3));
  expect(() => createBackup(data)).toThrow(/大小|2 MiB/);
});

for (const version of [0, 2, "1"]) {
  test(`unsupported format version ${JSON.stringify(version)} is rejected without inventing a migration`, () => {
    expect(() => parseBackup(JSON.stringify({ ...rawFile(), formatVersion: version }))).toThrow(/版本/);
  });
}

const invalidFiles: { name: string; mutate: (value: ReturnType<typeof rawFile>) => unknown }[] = [
  { name: "another application's file", mutate: (file) => ({ ...file, app: "another-app" }) },
  { name: "a missing category", mutate: () => ({ ...rawFile(), data: { entries: {} } }) },
  { name: "an unknown envelope property", mutate: (file) => ({ ...file, server: "https://invalid.example" }) },
  { name: "an unknown data category", mutate: (file) => ({ ...file, data: { ...fixture(), uploads: [] } }) },
  { name: "an unknown nested property", mutate: () => {
    const data = fixture();
    return rawFile({ ...data, settings: { ...data.settings, secret: "must not be silently dropped" } });
  } },
  { name: "a required property with the wrong type", mutate: () => {
    const data = fixture();
    return rawFile({ ...data, partner: { ...data.partner, completedThisWeek: "true" } });
  } },
  { name: "an invalid enum", mutate: () => {
    const data = fixture();
    return rawFile({ ...data, settings: { ...data.settings, theme: "unknown-theme" } });
  } },
  { name: "an impossible calendar date", mutate: () => {
    const data = fixture();
    return rawFile({ ...data, entries: { "2025-02-29": { ...data.entries["2024-02-29"], date: "2025-02-29" } } });
  } },
  { name: "a date that does not match its entry", mutate: () => {
    const data = fixture();
    return rawFile({ ...data, entries: { "2024-03-01": data.entries["2024-02-29"] } });
  } },
  { name: "an invalid leap-day timestamp", mutate: (file) => ({ ...file, exportedAt: "2025-02-29T12:00:00Z" }) },
  { name: "an out-of-range timestamp hour", mutate: (file) => ({ ...file, exportedAt: "2026-10-22T24:00:00Z" }) },
  { name: "an invalid place timestamp", mutate: () => {
    const data = fixture();
    data.places[0].createdAt = "yesterday";
    return rawFile(data);
  } },
  { name: "an invalid partner timestamp", mutate: () => {
    const data = fixture();
    data.partner.updatedAt = "2026-13-22T12:00:00Z";
    return rawFile(data);
  } },
  { name: "duplicate place identifiers", mutate: () => {
    const data = fixture();
    data.places.push({ ...data.places[0], name: "a different place with the same ID" });
    return rawFile(data);
  } },
  { name: "an empty place identifier", mutate: () => {
    const data = fixture();
    data.places[0].id = "";
    return rawFile(data);
  } },
  { name: "a null prayer object", mutate: () => {
    const data = fixture();
    return rawFile({ ...data, entries: { "2024-02-29": { ...data.entries["2024-02-29"], salah: null } } });
  } }
];

for (const { name, mutate } of invalidFiles) {
  test(`import rejects ${name} instead of accepting a partial or changed interpretation`, () => {
    expect(() => parseBackup(JSON.stringify(mutate(rawFile())))).toThrow();
  });
}

for (const key of ["__proto__", "constructor", "prototype"]) {
  test(`dangerous property ${key} cannot enter the returned object graph`, () => {
    const text = JSON.stringify(rawFile()).replace('"appName":"测试应用"', `"appName":"测试应用","${key}":{"polluted":true}`);
    expect(() => parseBackup(text)).toThrow();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
}

test("export rejects unrecognized existing data rather than silently dropping fields", () => {
  const data = fixture();
  Object.assign(data.settings, { unrecognized: "keep this until reviewed" });
  expect(() => createBackup(data)).toThrow();
});

test("invalid export metadata cannot create a file that the parser would refuse", () => {
  expect(() => createBackup(fixture(), "not-a-time")).toThrow(/时间/);
});
