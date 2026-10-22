"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { isValidStoredValue } from "@/lib/storage-validation";

export const storageKeys = {
  entries: "osc:daily-entries",
  places: "osc:places",
  partner: "osc:partner",
  settings: "osc:settings"
} as const;

type StorageStatus = {
  hydrated: boolean;
  error: "read" | "write" | null;
};

function readValue<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  const parsed: unknown = JSON.parse(raw);
  if (!isValidStoredValue(key, parsed)) throw new Error("Invalid saved data");
  return parsed as T;
}

export function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [status, setStatus] = useState<StorageStatus>({ hydrated: false, error: null });
  const fallbackRef = useRef(fallback);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function refresh() {
      if (cancelled) return;
      try {
        setValue(readValue(key, fallbackRef.current));
        setStatus({ hydrated: true, error: null });
      } catch {
        // Do not replace unreadable data with defaults, even on a later edit.
        setStatus({ hydrated: true, error: "read" });
      }
      hydratedRef.current = true;
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    queueMicrotask(refresh);
    return () => {
      cancelled = true;
      hydratedRef.current = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const updateValue = useCallback((update: SetStateAction<T>): boolean => {
    if (!hydratedRef.current) return false;
    let latest: T;
    try {
      // Re-read before applying an update so sequential edits in another tab survive.
      latest = readValue(key, fallbackRef.current);
    } catch {
      setStatus({ hydrated: true, error: "read" });
      return false;
    }
    const next = typeof update === "function" ? (update as (current: T) => T)(latest) : update;
    try {
      if (!isValidStoredValue(key, next)) throw new Error("Invalid updated data");
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      setValue(latest);
      setStatus({ hydrated: true, error: "write" });
      return false;
    }
    setValue(next);
    setStatus({ hydrated: true, error: null });
    return true;
  }, [key]);

  return [value, updateValue, status] as const;
}
