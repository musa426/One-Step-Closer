# Next lint directory-glob adapter

This is a small MIT-licensed package maintained by One Step Closer, not a patched
release of `fast-glob`. It only implements the call made by
`@next/eslint-plugin-next@16.4.2`: `globSync(pattern, { onlyDirectories: true })`.
Other options and input shapes throw an error. Other fast-glob APIs are not provided.

The root package applies this replacement only beneath that exact Next plugin
version. All official Next ESLint rules stay enabled. The replacement removes the
plugin's `fast-glob -> micromatch -> braces` dependency chain while the upstream
`braces` advisory has no published patched release.

The root development dependency named `fast-glob` points to this local package;
the scoped override refers to it as `$fast-glob`. This anchors the local path at
the repository root. A nested `file:./vendor/...` override alone resolves relative
to the Next plugin and can create a broken link even when npm reports success.
The package's own name and version remain distinct from upstream fast-glob.

Directory matching uses `tinyglobby@0.2.17`; this package does not implement a glob
engine. It preserves literal roots (including `.`), relative versus absolute paths,
and the directory-only behavior needed for root discovery. Directory expansion is
disabled, and a trailing `**` selects descendants without adding the root itself.

Run `node --test scripts/tests/next-lint-glob.test.mjs` from the repository root.
The tests include the real installed Next plugin and verify that internal anchor
navigation and `location.assign` still produce lint reports. When upgrading the
Next plugin, review its glob usage and remove this adapter when an official
release no longer needs the vulnerable chain.

References:
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
- https://github.com/vercel/next.js/blob/v16.4.2/packages/eslint-plugin-next/src/utils/get-root-dirs.ts
- https://superchupu.dev/tinyglobby/migration
