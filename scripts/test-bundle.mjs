import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function packedFilePaths(root) {
  const cacheDir = await mkdtemp(join(tmpdir(), "dsh-usage-lite-pack-cache-"));
  try {
    const { stdout } = await execFileAsync(
      npmCommand,
      ["pack", "--dry-run", "--json", "--ignore-scripts"],
      {
        cwd: root,
        env: {
          ...process.env,
          npm_config_cache: cacheDir
        }
      }
    );
    const listing = JSON.parse(stdout);
    assert.ok(Array.isArray(listing));
    assert.equal(listing.length, 1);
    const [entry] = listing;
    assert.ok(Array.isArray(entry?.files));
    return entry.files.map((file) => file?.path).filter((path) => typeof path === "string");
  } finally {
    await rm(cacheDir, { recursive: true, force: true });
  }
}

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
await access(join(root, "lib", "provider-runtime.js"));
for (const provider of ["deepseek", "openai", "anthropic", "gemini", "qwen", "zhipu", "minimax"]) {
  await access(join(root, "lib", "providers", `${provider}.js`));
}
assert.equal(manifest.publishConfig?.access, "public");
assert.equal(manifest.scripts?.prepublishOnly, "npm run check && npm test");

const patchPath = join(root, normalize(patchDeclaration));
await access(patchPath);
const patch = await readFile(patchPath, "utf8");
assert.equal([...patch.matchAll(/^\s+name:\s+"dsh-usage-lite"\s*$/gm)].length, 1);
const readme = await readFile(join(root, "README.md"), "utf8");
assert.ok(readme.includes("lib/providers/"));
assert.ok(readme.includes("unpricedTokens"));
assert.ok(readme.includes("current-public-price-partial-context"));
assert.ok(readme.includes("MiniMax"));
assert.ok(readme.includes("智谱"));
const packedPaths = await packedFilePaths(root);
assert.ok(packedPaths.includes("lib/provider-runtime.js"));
for (const provider of ["deepseek", "openai", "anthropic", "gemini", "qwen", "zhipu", "minimax"]) {
  assert.ok(packedPaths.includes(`lib/providers/${provider}.js`));
}
for (const pattern of [/^\.git\//, /^\.superpowers\//, /(^|\/)\.dsh\//, /(^|\/)\.env(\.|$)/i, /\.credentials\.ya?ml$/i, /(^|\/)\.npmrc$/i, /(^|\/)\.DS_Store$/]) {
  assert.equal(packedPaths.some((path) => pattern.test(path)), false);
}

console.log("bundle ok");
