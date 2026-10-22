export type FoodStatus = "halal" | "vegetarian_seafood" | "unsure" | "not_halal" | null;

export type SalahKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type QuranStatus = "none" | "translation" | "tafsir" | "listened" | "five_minutes" | null;

export type PlaceType = "restaurant" | "grocery" | "vegetarian_option" | "other";

export type PartnerGoal =
  | "eat_halal_together"
  | "try_new_halal_place"
  | "cook_halal_meal"
  | "avoid_active_non_halal";

export type MainFocus = "food" | "salah" | "quran" | "balanced";

export type ThemeName = "warm" | "green" | "minimal";

export type DailyEntry = {
  date: string;
  foodStatus: FoodStatus;
  salah: Record<SalahKey, boolean>;
  quran: QuranStatus;
  reflection: string;
};

export type SavedPlace = {
  id: string;
  name: string;
  type: PlaceType;
  location: string;
  notes: string;
  favorite: boolean;
  createdAt: string;
};

export type PartnerState = {
  personOne: string;
  personTwo: string;
  weeklyGoal: PartnerGoal | null;
  completedThisWeek: boolean;
  note: string;
  updatedAt: string | null;
};

export type SettingsState = {
  appName: string;
  mainFocus: MainFocus;
  reminderText: string;
  theme: ThemeName;
};

export const salahLabels: Record<SalahKey, string> = {
  fajr: "Fajr 晨礼",
  dhuhr: "Dhuhr 晌礼",
  asr: "Asr 晡礼",
  maghrib: "Maghrib 昏礼",
  isha: "Isha 宵礼"
};

export const foodLabels: Record<NonNullable<FoodStatus>, string> = {
  halal: "清真",
  vegetarian_seafood: "素食 / 海鲜",
  unsure: "不确定",
  not_halal: "今天不是清真"
};

export const quranLabels: Record<NonNullable<QuranStatus>, string> = {
  none: "今天先暂停",
  translation: "读了译文",
  tafsir: "读了 tafsir",
  listened: "聆听了",
  five_minutes: "5 分钟以上"
};

export const placeTypeLabels: Record<PlaceType, string> = {
  restaurant: "餐厅",
  grocery: "超市 / 食材",
  vegetarian_option: "素食选择",
  other: "其他"
};

export const partnerGoalLabels: Record<PartnerGoal, string> = {
  eat_halal_together: "这周一起吃一次清真",
  try_new_halal_place: "尝试一家新的清真地点",
  cook_halal_meal: "一起做一顿清真饭",
  avoid_active_non_halal: "少一次主动选择非清真"
};

export const focusLabels: Record<MainFocus, string> = {
  food: "饮食",
  salah: "礼拜",
  quran: "Qur'an",
  balanced: "平衡"
};

export const themeLabels: Record<ThemeName, string> = {
  warm: "温暖",
  green: "绿意",
  minimal: "极简"
};

export const defaultSettings: SettingsState = {
  appName: "One Step Closer",
  mainFocus: "balanced",
  reminderText: "今天只需要靠近一点点。",
  theme: "warm"
};

export const defaultPartnerState: PartnerState = {
  personOne: "我",
  personTwo: "同行的人",
  weeklyGoal: null,
  completedThisWeek: false,
  note: "",
  updatedAt: null
};

export function createBlankEntry(date: string): DailyEntry {
  return {
    date,
    foodStatus: null,
    salah: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false
    },
    quran: null,
    reflection: ""
  };
}
