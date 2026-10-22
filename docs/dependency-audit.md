# Dependency audit · 2026-10-22

The final lockfile reports **0 vulnerabilities in the full audit, including development tools**, and **0 in the production-only audit**. This is a point-in-time npm advisory result, not a guarantee that the application has no vulnerabilities.

## What changed

The previous full audit listed 9 affected dependency entries (7 high, 2 moderate). Several entries shared an underlying advisory.

| Affected chain | Resolution |
| --- | --- |
| Tailwind 3 → `chokidar`, `fast-glob`, `micromatch`, `braces` | Migrated to Tailwind CSS 4.3.3 with `@tailwindcss/postcss` 4.3.3; removed the old build chain and Autoprefixer. |
| Tailwind 3 → `postcss-nested`, `postcss-selector-parser` | Removed with the Tailwind 4 migration. |
| Next ESLint plugin → `fast-glob`, `micromatch`, `braces` | Replaced only the directory matcher used by `@next/eslint-plugin-next@16.4.2` with a local adapter backed by `tinyglobby@0.2.17`. All official Next lint rules remain enabled. |

`tailwind-merge` is now 3.7.0, compatible with Tailwind 4. The stylesheet preserves the existing fonts, heading sizes, custom shadow, blur, focus outlines, and theme colors. Browser requirements are now Safari 16.4+, Chrome 111+, or Firefox 128+.

## Why a local lint adapter exists

The inspected Next plugin still depends on the affected glob chain. The registry's automatic proposal downgrades the Next ESLint configuration to version 14, while this application uses Next 16. We kept the current configuration and rules.

The root development dependency named `fast-glob` points to `vendor/next-lint-glob`. Its actual package name is `@one-step-closer/next-lint-glob`; it is **not an upstream patched fast-glob release**. The scoped override uses `$fast-glob` so npm resolves the local package from the project root. The adapter implements only the synchronous directory lookup used by this exact Next plugin version; unknown argument shapes fail explicitly.

See [the adapter's scope and removal instructions](../vendor/next-lint-glob/README.md). Its tests check root-directory matching, actual package resolution, and actual Next lint reports. No Next rule was disabled. One import-style rule is disabled only for the adapter's CommonJS file because the Next plugin loads it synchronously.

## Verification and maintenance

A clean `npm ci` and `npm ls --all` confirmed the final lockfile installs without invalid dependency links. The affected `braces`, `micromatch`, `chokidar`, `postcss-nested`, and `postcss-selector-parser` packages are absent from that lockfile.

Reproduce the checks:

```bash
npm ci
npx playwright install chromium
npm run check
npm ls --all
npm audit
npm audit --omit=dev
```

`npm run check` includes tooling compatibility tests as well as lint, type checking, production build, and browser tests. GitHub Actions now audits **all** dependencies and fails on low-or-higher advisories; it does not omit development tools. The workflow is prepared locally; a GitHub-hosted run has not yet occurred.

When upgrading Next's ESLint plugin, review its directory-matching API and remove the adapter once upstream no longer uses the affected chain. Do not broaden or remove its version restriction without checking the tooling tests and full audit.

React 18 and ESLint 9 still emit maintenance/deprecation notices. Those notices are distinct from the resolved npm security advisories; their future major-version migrations remain separate work.

Sources: [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [selector parser advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), [Tailwind migration guide](https://tailwindcss.com/docs/upgrade-guide), [tailwind-merge compatibility](https://github.com/dcastil/tailwind-merge), and the [Next 16.4.2 directory lookup](https://github.com/vercel/next.js/blob/v16.4.2/packages/eslint-plugin-next/src/utils/get-root-dirs.ts).
