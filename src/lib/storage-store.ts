import { createBackup, summarizeData, type AppData, type BackupFile } from "@/lib/backup";
import { isValidStoredValue } from "@/lib/storage-validation";
import { defaultPartnerState, defaultSettings } from "@/lib/types";

export const storageKeys = {
  entries: "osc:daily-entries", places: "osc:places", partner: "osc:partner", settings: "osc:settings"
} as const;
export const snapshotKey = "osc:state";
const lockName = "osc:state-write";
export const changeEvent = "osc:state-changed";
export const emptyData: AppData = { entries: {}, places: [], partner: defaultPartnerState, settings: defaultSettings };

type Snapshot = {
  schemaVersion: 1;
  revision: string;
  epoch: string;
  legacyFingerprint: string;
  data: AppData;
};
type ReadState = Snapshot & { raw: string | null; legacy: (string | null)[] };
export type RestorePreview = {
  backup: BackupFile;
  revision: string;
  currentSummary: ReturnType<typeof summarizeData>;
};

export class StorageFailure extends Error {
  constructor(message: string, public readonly kind: "read" | "write" = "write") { super(message); }
}
export function errorMessage(error: unknown) {
  return error instanceof StorageFailure ? error.message : "保存失败，刚才的更改没有保留。请检查浏览器存储空间或权限后重试。";
}
function readLegacy() { return Object.values(storageKeys).map((key) => localStorage.getItem(key)); }
function equalLegacy(a: (string | null)[], b: (string | null)[]) { return a.every((value, index) => value === b[index]); }
function validData(value: unknown): value is AppData {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return Object.entries(storageKeys).every(([group, key]) => isValidStoredValue(key, data[group]));
}
async function fingerprint(legacy: (string | null)[]) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(legacy)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Reading never migrates or repairs data. The original four keys stay intact.
export async function readState(): Promise<ReadState> {
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const raw = localStorage.getItem(snapshotKey);
      const legacy = readLegacy();
      const legacyFingerprint = await fingerprint(legacy);
      if (raw !== localStorage.getItem(snapshotKey) || !equalLegacy(legacy, readLegacy())) continue;
      if (raw !== null) {
        const saved = JSON.parse(raw) as Snapshot;
        if (!saved || saved.schemaVersion !== 1 || typeof saved.revision !== "string" || !saved.revision ||
          typeof saved.epoch !== "string" || !saved.epoch || typeof saved.legacyFingerprint !== "string" || !validData(saved.data)) {
          throw new Error("Invalid snapshot");
        }
        if (saved.legacyFingerprint !== legacyFingerprint) {
          throw new StorageFailure("检测到旧版本窗口修改了记录。两份数据均已保留，暂时停止编辑；请关闭旧窗口并联系维护者处理冲突。", "read");
        }
        return { ...saved, raw, legacy };
      }
      const data = Object.fromEntries(Object.keys(storageKeys).map((group, index) =>
        [group, legacy[index] === null ? emptyData[group as keyof AppData] : JSON.parse(legacy[index]!)]));
      if (!validData(data)) throw new Error("Invalid legacy data");
      return { schemaVersion: 1, revision: `legacy:${legacyFingerprint}`, epoch: "legacy", legacyFingerprint, data, raw, legacy };
    }
    throw new StorageFailure("记录正在其他窗口中变化，请稍后重新读取。", "read");
  } catch (error) {
    if (error instanceof StorageFailure) throw error;
    throw new StorageFailure("无法读取本机保存的部分数据。原始内容已保留；为避免覆盖，暂时停止编辑。请刷新后重试，问题仍在时联系维护者。", "read");
  }
}

export function canWrite() { return typeof navigator !== "undefined" && Boolean(navigator.locks?.request); }
export async function withWriteLock<T>(action: () => Promise<T>): Promise<T> {
  if (!canWrite()) return Promise.reject(new StorageFailure("此浏览器不支持安全保存所需的 Web Locks。记录仍可查看和导出，请使用支持的浏览器编辑。", "read"));
  try {
    return await navigator.locks.request(lockName, action);
  } catch (error) {
    if (error instanceof StorageFailure) throw error;
    throw new StorageFailure(errorMessage(error));
  }
}
function commit(current: ReadState, data: AppData, epoch: string) {
  if (!validData(data)) throw new StorageFailure("更改的记录格式不正确，未保存。原始数据已保留。");
  // No await between the last consistency check and the single atomic setItem.
  if (localStorage.getItem(snapshotKey) !== current.raw || !equalLegacy(readLegacy(), current.legacy)) {
    throw new StorageFailure("记录已发生变化，请重新读取后再试。");
  }
  const saved: Snapshot = { schemaVersion: 1, revision: crypto.randomUUID(), epoch,
    legacyFingerprint: current.legacyFingerprint, data };
  localStorage.setItem(snapshotKey, JSON.stringify(saved));
  window.dispatchEvent(new Event(changeEvent));
  return saved;
}
export function updateData(updater: (current: AppData) => AppData, expectedEpoch: string) {
  return withWriteLock(async () => {
    const current = await readState();
    if (current.epoch !== expectedEpoch) throw new StorageFailure("另一窗口已恢复备份。刚才排队的修改没有保存，请查看恢复后的记录并重新编辑。");
    return commit(current, updater(current.data), current.epoch);
  });
}
async function readConsistently() { return canWrite() ? withWriteLock(readState) : readState(); }
export async function exportStoredBackup() { return createBackup((await readConsistently()).data); }
export async function prepareStoredRestore(backup: BackupFile): Promise<RestorePreview> {
  const copy = createBackup(backup.data, backup.exportedAt);
  const current = await readConsistently();
  return { backup: copy, revision: current.revision, currentSummary: summarizeData(current.data) };
}
export function restoreStoredBackup(preview: RestorePreview) {
  return withWriteLock(async () => {
    const current = await readState();
    if (current.revision !== preview.revision) throw new StorageFailure("预览后记录已发生变化，未执行恢复。请重新选择文件并查看预览。");
    const backup = createBackup(preview.backup.data, preview.backup.exportedAt);
    return commit(current, backup.data, crypto.randomUUID());
  });
}
