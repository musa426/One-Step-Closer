"use client";

import { createContext, useCallback, useContext, useMemo, type SetStateAction } from "react";
import { useAppStorage, type RestorePreview } from "@/lib/storage";
import type { BackupFile } from "@/lib/backup";
import { createBlankEntry, type DailyEntry, type PartnerState, type SavedPlace, type SettingsState } from "@/lib/types";

type Setter<T> = (update: SetStateAction<T>) => Promise<boolean>;
type EntryUpdater = DailyEntry | ((entry: DailyEntry) => DailyEntry);
type AppContextValue = {
  entries: Record<string, DailyEntry>;
  setEntries: Setter<Record<string, DailyEntry>>;
  upsertEntry: (date: string, updater: EntryUpdater) => Promise<boolean>;
  places: SavedPlace[];
  setPlaces: Setter<SavedPlace[]>;
  partner: PartnerState;
  setPartner: Setter<PartnerState>;
  settings: SettingsState;
  setSettings: Setter<SettingsState>;
  storageReady: boolean;
  storageSaving: boolean;
  storageReadError: boolean;
  storageWriteError: boolean;
  storageMessage: string | null;
  exportBackup: () => Promise<BackupFile>;
  prepareRestore: (backup: BackupFile) => Promise<RestorePreview>;
  restoreBackup: (preview: RestorePreview) => Promise<void>;
};
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data, update, status, saving, exportBackup, prepareRestore, restoreBackup } = useAppStorage();
  const setEntries = useCallback<Setter<Record<string, DailyEntry>>>((action) => update("entries", action), [update]);
  const setPlaces = useCallback<Setter<SavedPlace[]>>((action) => update("places", action), [update]);
  const setPartner = useCallback<Setter<PartnerState>>((action) => update("partner", action), [update]);
  const setSettings = useCallback<Setter<SettingsState>>((action) => update("settings", action), [update]);
  const value = useMemo<AppContextValue>(() => ({
    ...data, setEntries, setPlaces, setPartner, setSettings,
    upsertEntry: (date, updater) => setEntries((entries) => {
      const entry = entries[date] ?? createBlankEntry(date);
      return { ...entries, [date]: typeof updater === "function" ? updater(entry) : updater };
    }),
    storageSaving: saving, storageReady: status.hydrated, storageReadError: status.readError, storageWriteError: status.writeError,
    storageMessage: status.message, exportBackup, prepareRestore, restoreBackup
  }), [data, setEntries, setPlaces, setPartner, setSettings, status, saving, exportBackup, prepareRestore, restoreBackup]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useAppData() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppData must be used within AppProvider");
  return context;
}
