# Vercel 部署与验证

本项目是 Next.js 应用，使用仓库根目录构建，不需要数据库、账户服务、API 密钥或环境变量。部署代码不会把用户浏览器中已有的记录上传到 Vercel。托管平台仍可能保存普通访问日志。

## 首次部署

1. 在 Vercel 导入 `musa426/One-Step-Closer`，确认是自己的目标工作区，项目目录为仓库根目录，框架为 Next.js。
2. 检查实际 Node.js 版本。项目的 `engines.node` 为 `>=22`，Vercel 当前会将该范围解析为 24.x，并覆盖控制台的版本选择；`.nvmrc` 和 GitHub Actions 使用 22。以部署构建日志为准，再完成下方部署验证，规则见 [Vercel Node.js 版本说明](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)。`vercel.json` 指定 `npm ci` 安装锁定的依赖，执行完整的 `npm run build`。保留 Next.js 默认输出目录，不要改成 `public` 或 `out`。
3. 先确认待部署提交的 GitHub Actions 检查通过。公开版本使用 `main`；开发分支的预览地址用于虚构数据测试。
4. 检查构建日志：Next.js 构建结束后还应执行 `scripts/build-service-worker.mjs`。只执行 `next build` 会漏掉离线使用所需的 `public/sw.js`；该文件由构建生成，不提交到 Git。
5. 使用项目固定的生产域名作为公开入口。先验证无需登录 Vercel 就能打开，再将实际网址写入中英文 README 和使用指南。不要把每次构建生成的临时地址作为长期入口。

记录按网站地址隔离。发布后保持公开域名稳定；更换域名前，让用户在旧地址导出备份，再在新地址手动恢复。更改域名或回滚代码都不会自动搬运或恢复用户记录。

Vercel 的具体入口与限制以其 [Next.js 部署文档](https://vercel.com/docs/frameworks/full-stack/nextjs)、[GitHub 集成文档](https://vercel.com/docs/git/vercel-for-github)和 [vercel.json 配置说明](https://vercel.com/docs/project-configuration/vercel-json)为准。首次关联 GitHub 时只授予所需仓库访问权限；不需要购买域名或为本项目添加付费组件。

## 公开前检查

在没有登录 Vercel 的新浏览器环境中，使用虚构数据检查：

- 固定 HTTPS 入口与五个页面都能打开：`/`、`/weekly`、`/places`、`/partner`、`/settings`。
- `/sw.js` 返回生成后的 JavaScript，`/manifest.webmanifest` 返回清单；不能是登录页或 404。
- 设置页的使用说明、反馈链接能打开仓库中已经发布的文件和模板。
- 保存后刷新能保留记录；导出备份、预览、取消、确认恢复都正常。
- 等待 service worker 就绪后断网，刷新、切换五个页面、保存并再次刷新，确认内容仍在。
- 检查手机宽度与键盘操作。记录浏览器及版本；浏览器模拟宽度不等同于 iOS 或 Android 真机验证。

维护者可使用现有自动化测试对部署地址复查。先在本机安装依赖和 Playwright Chromium，然后把下面的占位符换成已验证的固定入口：

```bash
PLAYWRIGHT_BASE_URL='https://YOUR-PRODUCTION-DOMAIN' npm test
```

测试使用隔离浏览器环境和虚构记录。它不会访问维护者日常使用的浏览器资料。记录对应 Git 提交、部署地址、运行结果与尚未验证的设备，不把“构建成功”视为所有浏览器都通过。

## 更新与回退

合并前运行 `npm run check`，确认 GitHub Actions 通过，再检查新部署。用户先联网获取更新，关闭同一网站全部标签页和已安装的 PWA 窗口，重新打开以启用新缓存。不要清除网站数据；这会删除记录。

回退前检查目标版本是否能读取当前存储格式。回滚托管版本不会撤销 localStorage 中已经保存的更改，旧窗口还可能保留缓存。出现数据冲突时保留两份数据，按[维护指南](maintaining.md)排查，不删除存储键。跨版本升级与回退需要各自验证，不能只依赖同一构建的离线测试。
