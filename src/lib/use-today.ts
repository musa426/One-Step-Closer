"use client";

import { useSyncExternalStore } from "react";
import { getTodayKey } from "@/lib/dates";

function subscribeToDateChange(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;

  function refresh() {
    clearTimeout(timer);
    onChange();

    // Local midnight follows the user's calendar, including daylight-saving changes.
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    timer = setTimeout(refresh, midnight.getTime() - now.getTime());
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") refresh();
  }

  refresh();
  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    clearTimeout(timer);
    window.removeEventListener("focus", refresh);
    window.removeEventListener("pageshow", refresh);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

// An empty server snapshot avoids rendering a build-time or server-timezone date.
export function useTodayKey() {
  return useSyncExternalStore(subscribeToDateChange, getTodayKey, () => "");
}
