import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { ESLint } from "eslint";

const require = createRequire(import.meta.url);
const fixture = mkdtempSync(path.join(tmpdir(), "osc-next-lint-"));
for (const directory of ["apps/one/src/app", "apps/two", "apps/one/nested"]) {
  mkdirSync(path.join(fixture, directory), { recursive: true });
}
writeFileSync(path.join(fixture, "apps/file.txt"), "not a directory");
writeFileSync(path.join(fixture, "apps/one/src/app/page.tsx"), "export default function Page() { return null; }");
after(() => rmSync(fixture, { recursive: true, force: true }));

function adapter() {
  return require("../../vendor/next-lint-glob/index.cjs");
}

function relativeResults(pattern) {
  return adapter().globSync(pattern, { onlyDirectories: true })
    .map((entry) => path.relative(fixture, path.resolve(entry)))
    .sort();
}

test("literal roots do not expand into descendants, including the current directory", () => {
  assert.deepEqual(relativeResults(path.join(fixture, "apps/one")), ["apps/one"]);
  const previous = process.cwd();
  try {
    process.chdir(fixture);
    assert.deepEqual(adapter().globSync(".", { onlyDirectories: true }), ["."]);
    assert.deepEqual(adapter().globSync("apps/one/", { onlyDirectories: true }), ["apps/one/"]);
    assert.deepEqual(adapter().globSync("missing", { onlyDirectories: true }), []);
    assert.deepEqual(adapter().globSync("apps/file.txt", { onlyDirectories: true }), []);
  } finally {
    process.chdir(previous);
  }
});

test("directory globs preserve absolute paths and exclude files and deeper descendants", () => {
  const matches = adapter().globSync(path.join(fixture, "apps/*"), { onlyDirectories: true });
  assert.ok(matches.every(path.isAbsolute));
  assert.deepEqual(relativeResults(path.join(fixture, "apps/*")), ["apps/one", "apps/two"]);
  assert.deepEqual(relativeResults(path.join(fixture, "apps/{one,two}")), ["apps/one", "apps/two"]);
});

test("relative globs stay relative and trailing globstars select descendants", () => {
  const previous = process.cwd();
  try {
    process.chdir(fixture);
    assert.deepEqual(adapter().globSync("apps/*", { onlyDirectories: true }).sort(), ["apps/one", "apps/two"]);
    assert.deepEqual(adapter().globSync("apps/one/**", { onlyDirectories: true }).sort(), ["apps/one/nested", "apps/one/src", "apps/one/src/app"]);
    assert.deepEqual(adapter().globSync("!(missing)", { onlyDirectories: true }), ["apps"]);
    assert.deepEqual(adapter().globSync("!apps/*", { onlyDirectories: true }), []);
  } finally {
    process.chdir(previous);
  }
});

test("unsupported call shapes fail explicitly instead of silently changing lint coverage", () => {
  for (const options of [{}, { onlyDirectories: false }, { onlyDirectories: true, dot: true }]) {
    assert.throws(() => adapter().globSync("apps/*", options), /onlyDirectories/);
  }
  for (const pattern of ["", ["apps/*"], null]) {
    assert.throws(() => adapter().globSync(pattern, { onlyDirectories: true }), /non-empty string/);
  }
});

test("the installed Next plugin resolves the compatibility package", () => {
  const fromNext = createRequire(require.resolve("@next/eslint-plugin-next"));
  const resolved = fromNext("fast-glob");
  assert.equal(fromNext("fast-glob/package.json").name, "@one-step-closer/next-lint-glob");
  assert.deepEqual(resolved.globSync(path.join(fixture, "apps/one"), { onlyDirectories: true }), [path.join(fixture, "apps/one")]);
  assert.throws(() => resolved.globSync("apps/*", { onlyDirectories: true, dot: true }), /onlyDirectories/);
});

test("real Next linting still reports internal anchor navigation and location.assign", async () => {
  const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
  const eslint = new ESLint({
    cwd: projectRoot,
    overrideConfig: [{ settings: { next: { rootDir: path.join(fixture, "apps/*") } } }]
  });
  const [result] = await eslint.lintText(
    'export default function Probe() { window.location.assign("/weekly"); return <a href="/">Home</a>; }',
    { filePath: "src/app/next-lint-probe.tsx" }
  );
  const reports = new Map(result.messages.map((message) => [message.ruleId, message.severity]));
  assert.equal(reports.get("@next/next/no-html-link-for-pages"), 2);
  assert.equal(reports.get("@next/next/no-location-assign-relative-destination"), 1);
});
