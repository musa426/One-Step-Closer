"use client";

import { createContext, useContext, useMemo } from "react";
import { useLocalStorageState, storageKeys } from "@/lib/storage";
import {
  createBlankEntry,
  defaultPartnerState,
  defaultSettings,
  type DailyEntry,
  type PartnerState,
  type SavedPlace,
  type SettingsState
} from "@/lib/types";

type EntryUpdater = DailyEntry | ((entry: DailyEntry) => DailyEntry);

type AppContextValue = {
  entries: Record<string, DailyEntry>;
  setEntries: React.Dispatch<React.SetStateAction<Record<string, DailyEntry>>>;
  upsertEntry: (date: string, updater: EntryUpdater) => void;
  places: SavedPlace[];
  setPlaces: (update: React.SetStateAction<SavedPlace[]>) => boolean;
  partner: PartnerState;
  setPartner: React.Dispatch<React.SetStateAction<PartnerState>>;
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
  storageReady: boolean;
  storageReadError: boolean;
  storageWriteError: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries, entriesStatus] = useLocalStorageState<Record<string, DailyEntry>>(storageKeys.entries, {});
  const [places, setPlaces, placesStatus] = useLocalStorageState<SavedPlace[]>(storageKeys.places, []);
  const [partner, setPartner, partnerStatus] = useLocalStorageState<PartnerState>(storageKeys.partner, defaultPartnerState);
  const [settings, setSettings, settingsStatus] = useLocalStorageState<SettingsState>(storageKeys.settings, defaultSettings);
  const statuses = [entriesStatus, placesStatus, partnerStatus, settingsStatus];
  const storageReady = statuses.every((status) => status.hydrated);
  const storageReadError = statuses.some((status) => status.error === "read");
  const storageWriteError = statuses.some((status) => status.error === "write");

  const value = useMemo<AppContextValue>(
    () => ({
      entries,
      setEntries,
      upsertEntry: (date, updater) => {
        setEntries((currentEntries) => {
          const current = currentEntries[date] ?? createBlankEntry(date);
          const next = typeof updater === "function" ? updater(current) : updater;
          return {
            ...currentEntries,
            [date]: next
          };
        });
      },
      places,
      setPlaces,
      partner,
      setPartner,
      settings,
      setSettings,
      storageReady,
      storageReadError,
      storageWriteError
    }),
    [entries, partner, places, setEntries, setPartner, setPlaces, setSettings, settings, storageReady, storageReadError, storageWriteError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }

  return context;
}
