"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Archive, Download } from "lucide-react";
import { useAppData } from "@/components/app-provider";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { MAX_BACKUP_BYTES, parseBackup, summarizeData } from "@/lib/backup";
import type { RestorePreview } from "@/lib/storage";

type PendingAction = "export" | "preview" | "restore" | null;
type Feedback = { kind: "success" | "error"; message: string } | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function RecordSummary({ title, summary }: {
  title: string;
  summary: RestorePreview["currentSummary"];
}) {
  return (
    <div className="min-w-0 rounded-lg bg-[hsl(var(--app-card-strong))] p-3">
      <h4 className="mb-2 font-medium">{title}</h4>
      <dl className="space-y-1 text-sm text-[hsl(var(--app-muted))]">
        <div className="flex justify-between gap-3"><dt>每日记录</dt><dd>{summary.entryCount} 天</dd></div>
        <div className="flex justify-between gap-3"><dt>保存地点</dt><dd>{summary.placeCount} 个</dd></div>
        <div><dt>记录日期</dt><dd className="mt-1 break-words">{summary.dateRange ?? "暂无每日记录"}</dd></div>
      </dl>
    </div>
  );
}

export function BackupPanel() {
  const { exportBackup, prepareRestore, restoreBackup } = useAppData();
  const fileId = useId();
  const privacyId = useId();
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const requestId = useRef(0);
  const busyRef = useRef(false);
  const downloads = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const activeDownloads = downloads.current;
    return () => {
      requestId.current += 1;
      activeDownloads.forEach((timeout, url) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
      });
      activeDownloads.clear();
    };
  }, []);

  useEffect(() => {
    if (preview) previewHeadingRef.current?.focus();
  }, [preview]);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  async function downloadBackup() {
    if (busyRef.current) return;
    busyRef.current = true;
    const id = ++requestId.current;
    setPending("export");
    setFeedback(null);
    try {
      const backup = await exportBackup();
      if (id !== requestId.current) return;
      const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      // Give the browser time to start its download, then release the temporary URL.
      downloads.current.set(url, setTimeout(() => {
        URL.revokeObjectURL(url);
        downloads.current.delete(url);
      }, 1000));
      const link = document.createElement("a");
      link.href = url;
      link.download = `one-step-closer-backup-${backup.exportedAt.slice(0, 10)}.json`;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
      setFeedback({ kind: "success", message: "已生成备份。请确认文件已保存到下载位置。" });
    } catch (error) {
      if (id === requestId.current) setFeedback({ kind: "error", message: errorMessage(error, "无法导出备份，请重试。") });
    } finally {
      if (id === requestId.current) {
        busyRef.current = false;
        setPending(null);
      }
    }
  }

  async function selectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const id = ++requestId.current;
    setPreview(null);
    setConfirmed(false);
    setFeedback(null);
    busyRef.current = Boolean(file);
    setPending(file ? "preview" : null);
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("备份文件超过 2 MiB，请选择较小的备份文件。");
      const text = await file.text();
      if (id !== requestId.current) return;
      const nextPreview = await prepareRestore(parseBackup(text));
      if (id === requestId.current) setPreview(nextPreview);
    } catch (error) {
      if (id === requestId.current) {
        setFeedback({ kind: "error", message: errorMessage(error, "无法读取这个备份文件，请重新选择。") });
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally {
      // An earlier, slow file read must never overwrite a later selection.
      if (id === requestId.current) {
        busyRef.current = false;
        setPending(null);
      }
    }
  }

  function cancelRestore() {
    requestId.current += 1;
    setPreview(null);
    setConfirmed(false);
    setFeedback(null);
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.focus();
    }
  }

  async function confirmRestore() {
    if (!preview || !confirmed || busyRef.current) return;
    busyRef.current = true;
    const id = ++requestId.current;
    setPending("restore");
    setFeedback(null);
    try {
      await restoreBackup(preview);
      if (id === requestId.current) setFeedback({ kind: "success", message: "恢复完成，备份中的记录已保存在当前浏览器。" });
    } catch (error) {
      if (id === requestId.current) setFeedback({
        kind: "error",
        message: `${errorMessage(error, "恢复未完成。")} 请重新选择备份文件并检查预览后重试。`
      });
    } finally {
      if (id === requestId.current) {
        setPreview(null);
        setConfirmed(false);
        if (fileRef.current) fileRef.current.value = "";
        busyRef.current = false;
        setPending(null);
      }
    }
  }

  return (
    <SectionCard icon={Archive} title="数据备份与恢复" description="把记录保存到浏览器之外，或从已有备份中恢复。">
      <div className="space-y-5">
        <p id={privacyId} className="text-sm leading-relaxed text-[hsl(var(--app-muted))]">
          备份包含每日记录、地点、伙伴信息和设置，文件未加密。请保存在自己信任的位置，不要上传到公开仓库。导入仅在本机浏览器处理，不会上传文件。
        </p>
        <Button variant="secondary" onClick={downloadBackup} disabled={pending !== null} aria-describedby={privacyId}>
          <Download className="h-4 w-4" aria-hidden="true" />导出备份
        </Button>
        <div className="space-y-2 border-t border-[hsl(var(--app-border))] pt-4">
          <label htmlFor={fileId} className="block text-sm font-medium">选择备份文件</label>
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept=".json,application/json"
            disabled={pending !== null}
            onChange={selectBackup}
            aria-describedby={privacyId}
            className="block min-h-11 w-full min-w-0 rounded-lg border border-[hsl(var(--app-border))] bg-[hsl(var(--app-card))] p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[hsl(var(--app-soft))] file:px-3 file:py-1 file:text-[hsl(var(--app-primary))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--app-primary))] disabled:opacity-60"
          />
          <p className="text-sm text-[hsl(var(--app-muted))]">支持本应用导出的 JSON 文件，最大 2 MiB。选择文件后会先显示预览。</p>
        </div>
        {preview ? (
          <div className="space-y-4 rounded-lg border border-[hsl(var(--app-border))] p-4">
            <h3 ref={previewHeadingRef} tabIndex={-1} className="text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--app-primary))]">恢复预览</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <RecordSummary title="备份文件" summary={summarizeData(preview.backup.data)} />
              <RecordSummary title="当前浏览器" summary={preview.currentSummary} />
            </div>
            <p className="text-sm leading-relaxed">恢复会替换当前浏览器中的全部每日记录、地点、伙伴信息和设置，不会自动合并。需要保留当前内容时，请先导出备份。</p>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-2 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={pending !== null}
                className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--app-primary))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--app-primary))]"
              />
              <span>我了解恢复会替换当前记录</span>
            </label>
            <div className="flex flex-wrap gap-3">
              <Button onClick={confirmRestore} disabled={!confirmed || pending !== null}>确认恢复</Button>
              <Button variant="secondary" onClick={cancelRestore} disabled={pending !== null}>取消恢复</Button>
            </div>
          </div>
        ) : null}
        {pending ? <p role="status" className="text-sm text-[hsl(var(--app-muted))]">
          {pending === "export" ? "正在生成备份…" : pending === "preview" ? "正在检查备份文件…" : "正在恢复记录，请稍候…"}
        </p> : null}
        {feedback ? <p ref={feedbackRef} tabIndex={-1} role={feedback.kind === "error" ? "alert" : "status"} className="rounded-lg bg-[hsl(var(--app-soft))] p-3 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--app-primary))]">
          {feedback.message}
        </p> : null}
      </div>
    </SectionCard>
  );
}
