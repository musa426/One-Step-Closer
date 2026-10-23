# 维护这一个小项目

项目目前负责五页本地记录及手动备份恢复。先保持记录可保存、可带走、可恢复；账户、云同步、地图和推送都不属于当前版本。

## 用 Codex 处理一次问题

在这个项目目录里开始工作，让 Codex 先读取 `AGENTS.md`、`README.md` 和相关源码。描述可以很具体，例如：

> 地点保存失败后，表单里的文字不应消失。请先复现，检查现有测试，只修复这个问题，并运行相关回归和完整检查。不要改变存储键，也不要上传 GitHub。

修改完成后，你需要能回答三个问题：原来哪一步有问题；现在用户会看到什么；哪项检查证明它改好了。代码细节可以逐步学习，功能取舍和验收标准需要由你理解。

`npm run check` 会运行代码检查、类型检查、构建工具兼容性测试、生产构建和浏览器回归。第一次先执行 `npm ci` 和 `npx playwright install chromium`。测试使用隔离浏览器和虚构记录，不使用你日常浏览器的数据。

## 初次放到 GitHub

1. 审阅 README、许可证和 `docs/dependency-audit.md`。用自己的浏览器实际记录、刷新、切换页面，确认你能解释当前功能。
2. 在自己的 GitHub 账号创建空仓库，再把这个项目的源码提交上去。已有 README 和 MIT 文件，不需要 GitHub 再生成一套。`package.json` 的 `private: true` 只防止误发 npm 包，不限制 GitHub 仓库公开。
3. 检查待提交清单。不要加入 `node_modules`、`.next`、`public/sw.js`、测试报告、环境文件或真实记录；`.gitignore` 已配置这些排除项。
4. 推送后查看 Actions 的 Check 工作流是否成功。这里提供了 CI 配置，但本地通过不代表 GitHub 上已经运行通过。
5. 如需要私密安全报告，在仓库设置中启用 private vulnerability reporting。仓库源码公开和部署在线演示是两件独立的事；部署需要支持当前 Next.js 项目的环境。

## 收到反馈时

让报告者提供浏览器、操作步骤、预期和实际结果，并用虚构记录复现。不要索要真实习惯数据。修复后保留回归测试，写清版本或提交中的变化。只记录真实发生的 issue、修复和版本发布，不用人为制造维护历史。

## 维护备份与存储

[备份格式](backup-format.md) 是用户带走记录的接口。[设计说明](backup-restore-design.md) 记录恢复与兼容性边界。修改任一字段前，先确定旧文件如何继续读取；不要把新结构直接标成旧版本，也不要跳过不认识的字段后声称恢复完整。

存储分为两部分：旧版 `osc:daily-entries`、`osc:places`、`osc:partner`、`osc:settings`，以及新版 `osc:state` 快照。没有快照时只读旧记录，第一次成功编辑或恢复才创建快照；原四个键不改写、不删除。快照包含四类数据、版本、修订标识、恢复代次和旧数据指纹。它们是应用内部状态，不写进备份文件。

新版的每次编辑与恢复共用 `osc:state-write` Web Lock，在锁内重新读取当前数据，再用一次 `localStorage.setItem` 提交完整快照。普通编辑保留其他窗口已经保存的修改；恢复核对预览修订标识，并换一个恢复代次，防止恢复前排队的编辑随后覆盖恢复结果。这个锁只协调遵守约定的新代码，不能控制旧版本或同源恶意脚本。

读取时计算旧数据指纹使用 Web Crypto 的 `crypto.subtle`，所以读取和导出也需要 HTTPS 或本机 `http://127.0.0.1` 安全上下文。不要把“没有 Web Locks 时可只读导出”理解成支持不安全的远程 HTTP 地址。

处理错误时：

| 情况 | 应保留什么、如何处理 |
| --- | --- |
| 文件损坏、版本不支持、超出 2 MiB | 不修改本地记录；保留文件，核对导出应用版本。不要手工删除版本字段来绕过检查 |
| 预览后数据发生变化 | 保留最新数据，重新选文件并检查新预览；需要保留两份时先分别备份 |
| 保存空间不足或写入被拒绝 | 保留原快照与旧键；检查存储权限或浏览器空间，不删除记录为迁移腾空间 |
| 旧窗口修改了旧键 | 关闭该网站全部旧标签页和 PWA 窗口；两份数据仍保留。关闭窗口不会自动消除已有冲突，需要维护者在用户本机核对并制定恢复方法 |
| 存储无法读取或版本未知 | 暂停编辑并保留原始内容；不要以空数据替代。此时导出或恢复也可能被阻止，不能把空文件当作成功备份 |
| 浏览器不支持 Web Locks | 只读；可正常读取的数据仍可导出。换用支持的浏览器时需手动带走文件，不会自动同步 |

不要让用户在公开 issue 上传真实备份。处理存储冲突时先索要错误文字、浏览器和版本，再用虚构数据复现；需要查看原始存储时应先说明内容敏感并安排私密渠道。清除网站数据会同时删除快照和旧键，不能作为修复步骤。

发布涉及存储的修改前，检查虚构数据往返恢复、预览取消不写入、损坏文件拒绝、失败写入保留原值、旧数据迁移、两个窗口并发编辑、过期预览、恢复前排队的编辑，以及旧窗口冲突。生产模式还要检查联网缓存后的离线导航、保存和备份恢复。执行 `npm run check`，将实际结果记在提交或 PR 中；测试文件存在不等于已经运行通过。

## 当前边界

- 记录只在同一网站地址、同一浏览器资料内保存。备份需手动导出和恢复，不提供云同步、自动合并或撤销恢复。
- 单快照提交避免四类数据只恢复一部分，但不能保证磁盘损坏、浏览器清理或丢失备份文件后的恢复。迁移保留旧键会占用额外空间。
- 记录和备份均未加密。格式校验不会证明备份来源可信，也不等于对同源恶意代码的隔离。
- 浏览器自动化不能替代 iPhone/iPad 真机安装测试；目前不宣称已完成这些验证。
- 当前源码是 Next.js 项目，没有单 HTML 文件导出，也没有配置 GitHub Pages。
- React 18 在当前 Next.js 中已被标记为弃用，ESLint 9 也有维护状态提示；未来升级要连同测试一起处理。本次已知依赖漏洞已清零，细节见审计记录。升级 Next 检查工具时，需要一并复核 `vendor/next-lint-glob` 兼容包；上游移除受影响的依赖链后再删除它。

### Pending saves and window closure

Ordinary edits update the screen immediately while the write waits for the shared lock. A visible saving status remains until pending writes settle. While a write or restore is pending, `beforeunload` requests the browser's leave-page warning; wait for saving to finish before refreshing or closing. Browsers can suppress that warning, especially when an app is killed on mobile. A forced close before commit leaves the previous snapshot; it does not promise preservation of unsaved edits. The browser tests cover a held-lock save, a cancelled reload warning, and closing a window with a queued restore.
