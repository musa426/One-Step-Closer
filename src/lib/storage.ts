"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import type { AppData, BackupFile } from "@/lib/backup";
import {
  canWrite, changeEvent, emptyData, errorMessage, exportStoredBackup, prepareStoredRestore,
  readState, restoreStoredBackup, snapshotKey, storageKeys, StorageFailure, updateData, type RestorePreview
} from "@/lib/storage-store";
export { storageKeys, type RestorePreview } from "@/lib/storage-store";

type Status = { hydrated: boolean; readError: boolean; writeError: boolean; message: string | null };
export function useAppStorage() {
  const [data, setData] = useState<AppData>(emptyData);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ hydrated: false, readError: false, writeError: false, message: null });
  const current = useRef(data);
  const epoch = useRef<string | null>(null);
  const pending = useRef(0);
  const generation = useRef(0);
  const mounted = useRef(false);
  const readBlocked = useRef(true);

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const saved = await readState();
      if (!mounted.current || request !== generation.current || pending.current > 0) return;
      current.current = saved.data;
      epoch.current = saved.epoch;
      setData(saved.data);
      readBlocked.current = !canWrite();
      setStatus((previous) => ({ ...previous, hydrated: true, readError: !canWrite(),
        message: !canWrite() ? "此浏览器不支持安全保存所需的 Web Locks。记录仍可查看和导出，请使用支持的浏览器编辑。" : previous.writeError ? previous.message : null }));
    } catch (error) {
      if (!mounted.current || request !== generation.current || pending.current > 0) return;
      readBlocked.current = true;
      setStatus({ hydrated: true, readError: true, writeError: false, message: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === snapshotKey || Object.values(storageKeys).some((key) => key === event.key)) void refresh();
    };
    const onChange = () => { void refresh(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(changeEvent, onChange);
    queueMicrotask(() => { void refresh(); });
    return () => {
      mounted.current = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(changeEvent, onChange);
    };
  }, [refresh]);

  useEffect(() => {
    if (!saving) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (pending.current === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [saving]);

  const update = useCallback(async <K extends keyof AppData>(group: K, action: SetStateAction<AppData[K]>): Promise<boolean> => {
    if (epoch.current === null || readBlocked.current) return false;
    const expectedEpoch = epoch.current;
    const apply = (value: AppData): AppData => ({ ...value, [group]: typeof action === "function"
      ? (action as (previous: AppData[K]) => AppData[K])(value[group]) : action });
    // Keep controlled inputs responsive. Pending writes use fresh persisted state under a shared lock.
    current.current = apply(current.current);
    setData(current.current);
    pending.current++;
    setSaving(true);
    generation.current++;
    setStatus({ hydrated: true, readError: false, writeError: false, message: null });
    try {
      await updateData(apply, expectedEpoch);
      return true;
    } catch (error) {
      if (mounted.current) {
        const readError = error instanceof StorageFailure && error.kind === "read";
        if (readError) readBlocked.current = true;
        setStatus({ hydrated: true, readError, writeError: !readError, message: errorMessage(error) });
      }
      return false;
    } finally {
      pending.current--;
      if (pending.current === 0) {
        await refresh();
        if (mounted.current && pending.current === 0) setSaving(false);
      }
    }
  }, [refresh]);

  const restoreBackup = useCallback(async (preview: RestorePreview) => {
    pending.current++;
    setSaving(true);
    generation.current++;
    try {
      await restoreStoredBackup(preview);
      setStatus({ hydrated: true, readError: false, writeError: false, message: null });
    } finally {
      pending.current--;
      if (pending.current === 0) {
        await refresh();
        if (mounted.current && pending.current === 0) setSaving(false);
      }
    }
  }, [refresh]);
  const exportBackup = useCallback(() => exportStoredBackup(), []);
  const prepareRestore = useCallback((backup: BackupFile) => prepareStoredRestore(backup), []);
  return { data, update, status, saving, exportBackup, prepareRestore, restoreBackup };
}
