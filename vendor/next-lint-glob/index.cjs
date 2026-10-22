const { statSync } = require("node:fs");
const path = require("node:path");
const { globSync: tinyGlobSync, isDynamicPattern } = require("tinyglobby");

// This is the sole fast-glob call used by @next/eslint-plugin-next 16.4.2.
// Fail on new options so an upstream change cannot silently weaken linting.
function globSync(pattern, options) {
  if (typeof pattern !== "string" || pattern.length === 0) {
    throw new TypeError("Next lint root pattern must be a non-empty string.");
  }
  if (!options || options.onlyDirectories !== true || Object.keys(options).length !== 1) {
    throw new TypeError("Next lint glob supports only { onlyDirectories: true }.");
  }
  // Next processes each root independently; a negative-only pattern matches none.
  if (pattern.startsWith("!") && !pattern.startsWith("!(")) return [];

  if (!isDynamicPattern(pattern)) {
    try {
      return statSync(pattern).isDirectory() ? [pattern] : [];
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return [];
      throw error;
    }
  }

  const absolute = path.isAbsolute(pattern);
  // fast-glob's trailing ** selects descendants, excluding the root itself.
  const expanded = pattern.replace(/(^|\/)\*\*\/?$/, "$1**/*");
  const fullPattern = path.resolve(expanded);
  const matches = tinyGlobSync(fullPattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: true,
    // Using the volume root also supports absolute globs outside process.cwd().
    cwd: path.parse(fullPattern).root
  });
  return matches.map((match) => absolute ? path.normalize(match) : path.relative(process.cwd(), match));
}

module.exports = { globSync };
