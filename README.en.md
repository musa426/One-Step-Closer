# One Step Closer

[中文](README.md)

A Chinese-first habit journal for Muslims, with daily records for food choices, salah, and Qur'an reading or listening. The interface uses gentle, non-judgmental language. Records stay in the current browser.

This is an early personal project built with Next.js, React, TypeScript, and Tailwind CSS. Reproducible bug reports, clearer documentation, and small contributions are welcome. The application interface is primarily Chinese; this file is an English introduction.

![Blank demo with no personal records](docs/images/desktop.png)

[Mobile-width preview](docs/images/mobile.png)

## Features

| Page | Purpose |
| --- | --- |
| Today | Record food choices, the five prayers, Qur'an engagement, and a short reflection |
| This week | Summarize records for the current week |
| Places | Manually save place names, location text, notes, and favorites |
| Partner Mode | Keep two names, one goal, and its completion status in the same browser |
| Settings | Change the display name, homepage reminder text, focus, and theme |

Places is a personal list, with no map search or halal certification. Partner Mode does not sync between people or devices. Reminder text appears on the homepage; it does not send notifications. Food labels and weekly counts are journal categories, not religious rulings.

## Run locally

Use Node.js 22 or newer; Node.js 22 or 24 is recommended. npm is included with Node.js.

Clone the repository or use **Code → Download ZIP** on GitHub and extract it. In the project directory:

```bash
npm ci
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). No account, API keys, or environment variables are required. The development server listens on the local machine only. Keep using the same address: `localhost` and `127.0.0.1` have separate browser storage.

For a production build:

```bash
npm run build
npm start -- --hostname 127.0.0.1 --port 3001
```

Open the production preview at [http://127.0.0.1:3001](http://127.0.0.1:3001). A separate port prevents production offline caches from hiding development changes. The two ports have independent records. If a production worker was previously installed on the development address, unregister that worker and delete its Cache Storage while preserving localStorage; do not clear all site data.

Deployment requires a Next.js hosting environment with Node.js support. Static export for GitHub Pages is not configured. Publishing the source to GitHub does not deploy the application.

## Mobile and offline use

Styling uses Tailwind CSS 4 and requires Safari 16.4+, Chrome 111+, or Firefox 128+. Prefer a browser version that still receives maintenance updates.

After the first online visit, the production build precaches all five pages and their build assets. These pages can open offline once caching is complete. Open the app online, allow caching to finish, then check offline loading and saving in your browser. The service worker registers only in production mode.

Installing on a phone generally requires HTTPS. Use your browser's install or “Add to Home Screen” option, where available. Check offline behavior in production mode; development mode is for editing and previews. The app has not been verified on a physical iOS device.

After a new version is published, go online to retrieve the update, then close every tab and installed PWA window for the site. Reopen the app to activate the new cache. Do not clear site data to update: doing so deletes local records.

## Data and limitations

Daily records, places, partner details, and settings use browser `localStorage`. The application does not upload these records or include analytics. A hosting provider may still keep ordinary website access logs.

- There are no accounts, cross-device sync, or backup import/export. Another browser, device, or website address has separate storage.
- Clearing site data can remove all records. Private browsing or unavailable browser storage may prevent records from persisting.
- Local storage is not encrypted. People with access to the same browser profile may be able to read the records.
- Weekly statistics use the device's local date, from Monday through Sunday. Partner goals remain until manually cleared; the completion checkbox shows as incomplete when a new week begins.

Use fictional records in demonstrations and reports. Do not upload real habit records, names, or locations to this repository.

## Checks and contributions

```bash
npx playwright install chromium
npm run check
```

Chromium installation is required before the first browser test run. `npm run check` runs lint, type checking, tooling compatibility tests, a production build, and browser regression tests, in that order. Run `npm run build` before running `npm test` separately. `npm run test:e2e` is an alias for the same tests and does not need to run again.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance and [SECURITY.md](SECURITY.md) for security reports. Issues and pull requests in Chinese or English are welcome.

Both the full dependency audit (including development tools) and the production-only audit reported zero vulnerabilities on 2026-10-22. Tailwind is now version 4; a tested, scoped adapter replaces the Next lint plugin's affected directory-matching dependency. See the [audit record](docs/dependency-audit.md). A [maintainer guide in Chinese](docs/maintaining.md) explains the release and maintenance workflow.

## Directory guide

| Location | Contents |
| --- | --- |
| `src/app/`, `src/components/` | Five pages, layouts, and shared UI |
| `src/lib/` | Types, dates, and local storage |
| `src/service-worker.js` | Source for offline caching logic |
| `scripts/build-service-worker.mjs` | Generates the cache list and `public/sw.js` during builds; the generated file is not committed |
| `public/` | Static files including the PWA manifest and icons |
| `tests/` | Browser regression tests |
| `vendor/next-lint-glob/`, `scripts/tests/` | Next.js lint directory-matching adapter and regression tests |

## License

[MIT](LICENSE) · Copyright (c) 2026 Musa (musa426). Third-party dependencies retain their own licenses.
