import { BookOpen } from "lucide-react";
import packageJson from "../../package.json";
import { SectionCard } from "@/components/section-card";

const linkClassName = "inline-flex min-h-11 items-center rounded-md px-2 text-[hsl(var(--app-primary))] underline underline-offset-4 hover:bg-[hsl(var(--app-soft))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--app-primary))]";

export function HelpPanel() {
  return (
    <SectionCard
      icon={BookOpen}
      title="使用与反馈"
      description={`当前版本 v${packageJson.version} · 说明与反馈页面需要联网打开。`}
    >
      <div className="space-y-3">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <a
            href="https://github.com/musa426/One-Step-Closer/blob/main/docs/getting-started.md"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            查看使用说明（新窗口）
          </a>
          <a
            href="https://github.com/musa426/One-Step-Closer/issues/new?template=usability_feedback.md"
            target="_blank"
            rel="noopener noreferrer"
            aria-describedby="feedback-privacy"
            className={linkClassName}
          >
            提交使用反馈（新窗口）
          </a>
        </div>
        <p id="feedback-privacy" className="text-sm leading-6 text-[hsl(var(--app-muted))]">
          GitHub 上的反馈会公开显示。请只描述操作步骤和遇到的问题，不要附上真实记录、姓名、私人地点或备份文件。
        </p>
      </div>
    </SectionCard>
  );
}
