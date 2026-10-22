function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf(value: unknown, options: readonly unknown[]) {
  return options.includes(value);
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === "string");
}

export function isValidStoredValue(key: string, value: unknown): boolean {
  switch (key) {
    case "osc:daily-entries":
      return isObject(value) && Object.entries(value).every(([date, entry]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) && isObject(entry) && entry.date === date &&
        isOneOf(entry.foodStatus, [null, "halal", "vegetarian_seafood", "unsure", "not_halal"]) &&
        isOneOf(entry.quran, [null, "none", "translation", "tafsir", "listened", "five_minutes"]) &&
        typeof entry.reflection === "string" && isObject(entry.salah) &&
        ["fajr", "dhuhr", "asr", "maghrib", "isha"].every((prayer) =>
          typeof (entry.salah as Record<string, unknown>)[prayer] === "boolean")
      );
    case "osc:places":
      return Array.isArray(value) && value.every((place) => isObject(place) &&
        hasStrings(place, ["id", "name", "location", "notes", "createdAt"]) &&
        isOneOf(place.type, ["restaurant", "grocery", "vegetarian_option", "other"]) &&
        typeof place.favorite === "boolean");
    case "osc:partner":
      return isObject(value) && hasStrings(value, ["personOne", "personTwo", "note"]) &&
        isOneOf(value.weeklyGoal, [null, "eat_halal_together", "try_new_halal_place", "cook_halal_meal", "avoid_active_non_halal"]) &&
        typeof value.completedThisWeek === "boolean" &&
        (value.updatedAt === null || typeof value.updatedAt === "string");
    case "osc:settings":
      return isObject(value) && hasStrings(value, ["appName", "reminderText"]) &&
        isOneOf(value.mainFocus, ["food", "salah", "quran", "balanced"]) &&
        isOneOf(value.theme, ["warm", "green", "minimal"]);
    default:
      return false;
  }
}
