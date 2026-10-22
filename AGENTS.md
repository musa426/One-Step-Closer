# Working on One Step Closer

This is a Chinese-first Muslim habit journal. Read `README.md` and the relevant source before changing behavior. Keep each change small enough for the maintainer to explain and verify.

## Product and data boundaries

- Preserve gentle, non-judgmental wording. Do not introduce guilt, leaderboards, or pressure about missed days.
- Partner Mode stores one local record; it is not online sharing. Saved places are a manual list; reminder text is not push notification functionality. Keep descriptions accurate.
- Preserve compatibility with existing `osc:*` localStorage keys and saved records. A schema change needs an explicit migration and checks with older data. Never clear user records as a shortcut.
- Do not add external uploads, tracking, or accounts without an explicit request and a clear explanation of the data flow.
- Never commit real daily records, partner names, private locations, credentials, API keys, `.env` contents, or screenshots containing personal data. Use fictional fixtures.

## Implementation and verification

- Prefer the existing Next.js, React, TypeScript, and Tailwind patterns. Avoid unrelated refactoring or new dependencies unless needed for the task.
- Before submitting application changes, install Chromium with `npx playwright install chromium` if needed, then run `npm run check`. It runs lint, type checking, tooling compatibility tests, a production build, and browser regression tests in that order. Standalone `npm test` requires a completed `npm run build`; `npm run test:e2e` is an alias, not an additional suite. Report actual results and any checks that could not run.
- Changes to routes, caching, PWA files, or build settings require production-mode checks: first online load, offline reload, page navigation, and record persistence. Development mode alone does not verify offline behavior.
- Edit `src/service-worker.js` for cache behavior. `scripts/build-service-worker.mjs` generates `public/sw.js` with all five routes and build assets during production builds. Never edit or commit the generated worker. Service worker registration is production-only.
- Check cache updates by closing every tab and installed PWA window for the origin, then reopening. Never clear site data as an update workaround; it deletes records. Use `http://127.0.0.1:3000` consistently for local previews rather than alternating with `localhost`.
- Dates and weeks follow local device time, with weeks starting on Monday. Partner goals persist until manually cleared, while their completion state is derived for the current week. Preserve date rollover behavior.
- Check responsive layout and keyboard access when changing UI. Keep Chinese and English README claims consistent.
- Documentation-only changes need content and link checks, not unrelated application tests.
- Keep the scoped `@next/eslint-plugin-next` glob override and its compatibility tests together. It replaces an affected dependency, not Next.js lint rules. Review `vendor/next-lint-glob/README.md` before upgrading the plugin. Run a full `npm audit`, including development tools, after dependency changes.
- Keep dependencies reproducible through `package-lock.json`. Do not commit generated output, dependency directories, test reports, or local editor state.
- Do not claim real users, maintenance history, successful tests, or program eligibility without evidence. Do not publish, push, or deploy unless authorized.
