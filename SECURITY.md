# 安全问题 / Security reports

目前优先检查默认分支上的问题；项目尚未承诺多个旧版本的安全维护，也没有固定响应时限。

请不要在公开 issue 中发布漏洞利用细节、凭证或真实个人记录。

如果仓库启用了 GitHub 私密漏洞报告，请从 **Security → Advisories → Report a vulnerability** 提交。若没有该入口，请通过维护者 [musa426 的 GitHub 个人主页](https://github.com/musa426) 当时公开提供的联系方式请求私密报告渠道；不要在公开渠道附上敏感内容。

报告请尽量包含受影响的版本或提交、浏览器、最小复现步骤、预期影响，以及只使用虚构数据的示例。

记录保存在浏览器 `localStorage`，没有加密，也没有账户隔离或云备份。手动导出的 JSON 文件同样未加密，可能包含习惯、伙伴名字和地点。请勿将本地存储视为安全保管库，也不要将真实备份上传到公开仓库。分享设备、浏览器资料或备份文件，可能暴露记录。

备份导入是一个不可信文件入口：应用在本机校验最大 2 MiB 的 UTF-8 JSON、应用标识、版本和完整嵌套结构，拒绝不认识的字段、无效日期和重复地点标识。预览不会写入；确认后才替换四类记录。文字按文字显示，不作为 HTML、脚本或命令执行。项目没有 AI Agent、插件执行或 Shell 执行功能。

值得报告的问题包括：恶意文件绕过校验或触发脚本、导入造成部分覆盖、并发恢复覆盖新记录、错误提示泄露内容，以及依赖或缓存更新引入的同源代码风险。Web Locks 只协调应用自身的写入；它不会限制同源恶意脚本、浏览器扩展或能直接访问设备的人。文件结构通过校验也不代表内容真实、来源可信或已经加密。

---

Security review currently focuses on the default branch. There is no commitment to maintain several older versions or to respond within a fixed time.

Do not publish exploit details, credentials, or real personal records in a public issue. If enabled, use **Security → Advisories → Report a vulnerability** for a private GitHub report. Otherwise, use a contact method currently published on [musa426's GitHub profile](https://github.com/musa426) to request a private reporting channel, without including sensitive details publicly.

Include the affected version or commit, browser, minimal reproduction steps, and expected impact. Use fictional data. Browser `localStorage` is unencrypted and has no account isolation or cloud backup. Manually exported JSON files are also unencrypted and may include habits, partner names, and places. Access to a device, browser profile, or backup file may expose records. Do not upload real backups to a public repository.

Backup import is an untrusted-file boundary. The app locally validates UTF-8 JSON up to 2 MiB, its application marker, version, and complete nested structure. Unknown fields, invalid dates, and duplicate place IDs are rejected. Preview does not write data; confirmation replaces all four categories. Text is displayed as text rather than executed as HTML, scripts, or commands. The project has no AI agent, plugin execution, or shell execution feature.

Relevant reports include malicious files bypassing validation or executing scripts, partial replacement during import, concurrent restores overwriting newer records, information disclosure through errors, and same-origin code risks introduced through dependencies or cache updates. Web Locks coordinate the app's own writes; they do not restrict malicious same-origin scripts, browser extensions, or people with device access. Valid structure does not establish authenticity, trustworthiness, or encryption.
