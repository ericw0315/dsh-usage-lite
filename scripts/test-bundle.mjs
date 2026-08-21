import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const patchDeclaration = manifest.dsh?.bundle?.patch;

assert.equal(patchDeclaration, "./cordis.patch.yml");
assert.ok(manifest.files?.includes("cordis.patch.yml"));
assert.equal(manifest.license, "MIT");
assert.equal(manifest.repository?.url, "git+https://github.com/ericw0315/dsh-usage-lite.git");
assert.equal(manifest.homepage, "https://github.com/ericw0315/dsh-usage-lite#readme");
assert.equal(manifest.bugs?.url, "https://github.com/ericw0315/dsh-usage-lite/issues");
assert.ok(manifest.files?.includes("LICENSE"));
await access(join(root, "LICENSE"));
assert.ok(manifest.files?.includes("docs/images/usage-lite-preview.jpg"));
await access(join(root, "docs", "images", "usage-lite-preview.jpg"));
assert.equal(manifest.publishConfig?.access, "public");
assert.equal(manifest.scripts?.prepublishOnly, "npm run check && npm test");

const patchPath = join(root, normalize(patchDeclaration));
await access(patchPath);
const patch = await readFile(patchPath, "utf8");
assert.equal([...patch.matchAll(/^\s+name:\s+"dsh-usage-lite"\s*$/gm)].length, 1);

console.log("bundle ok");
