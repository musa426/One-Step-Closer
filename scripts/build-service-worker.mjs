import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const buildId = (await readFile(path.join(root, ".next/BUILD_ID"), "utf8")).trim();
const files = await readdir(path.join(root, ".next/static"), { recursive: true, withFileTypes: true });
const assets = files.filter((file) => file.isFile()).map((file) =>
  "/_next/static/" + path.relative(path.join(root, ".next/static"), path.join(file.parentPath, file.name)).split(path.sep).join("/")
).sort();
const routes = ["/", "/weekly", "/places", "/partner", "/settings"];
const template = await readFile(path.join(root, "src/service-worker.js"), "utf8");
const worker = template
  .replace('"BUILD_ID_PLACEHOLDER"', JSON.stringify(buildId))
  .replace('["PRECACHE_PLACEHOLDER"]', JSON.stringify([...routes, "/manifest.webmanifest", "/icon.svg", ...assets]));
await writeFile(path.join(root, "public/sw.js"), worker);
console.log(`Prepared offline cache: ${routes.length} pages and ${assets.length} build assets.`);
