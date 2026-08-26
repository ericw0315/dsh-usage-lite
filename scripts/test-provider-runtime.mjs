import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  loadProviderAdapters,
  validateAdapter,
  matchProvider,
  normalizeProvider,
  fetchProviderBalance,
  resolveProviderPrice
} from "../lib/provider-runtime.js";

const base = {
  id: "sample",
  capabilities: { balance: false, pricing: true },
  matches: (config) => config.id === "sample",
  normalizeConfig: (config) => ({ ...config, adapterId: "sample" }),
  resolvePrice: () => ({ status: "unknown", unpricedTokens: 3 })
};

assert.equal(validateAdapter(base, "sample.js"), base);
assert.throws(() => validateAdapter({ ...base, capabilities: { balance: true, pricing: true } }, "bad.js"), /fetchBalance/);
assert.equal(matchProvider([base], { id: "sample" }), base);
assert.equal(matchProvider([base], { id: "other" }), null);
assert.throws(() => matchProvider([base, { ...base, id: "second" }], { id: "sample" }), /ambiguous-adapter/);
assert.deepEqual(normalizeProvider([base], { id: "sample" }), { adapter: base, provider: { id: "sample", adapterId: "sample" } });
assert.deepEqual(resolveProviderPrice(null, { usage: { inputTokens: 3 } }), { status: "unknown", unpricedTokens: 3 });

const failed = await fetchProviderBalance({
  ...base,
  capabilities: { balance: true, pricing: true },
  fetchBalance: async () => { throw new Error("secret upstream body"); }
}, { id: "sample" }, { now: () => 123 });
assert.equal(failed.error, "upstream-error");
assert.equal(JSON.stringify(failed).includes("secret upstream body"), false);

const sortedDir = await mkdtemp(join(tmpdir(), "provider-runtime-"));
await writeFile(join(sortedDir, "zeta.js"), "export default { id: 'zeta', capabilities: { balance: false, pricing: false }, matches: () => false, normalizeConfig: (config) => config };\n");
await writeFile(join(sortedDir, "alpha.js"), "export default { id: 'alpha', capabilities: { balance: false, pricing: false }, matches: () => false, normalizeConfig: (config) => config };\n");
const loaded = await loadProviderAdapters(pathToFileURL(`${sortedDir}/`));
assert.deepEqual(loaded.map((adapter) => adapter.id), ["alpha", "zeta"]);

const duplicateDir = await mkdtemp(join(tmpdir(), "provider-runtime-dup-"));
await writeFile(join(duplicateDir, "first.js"), "export default { id: 'dup', capabilities: { balance: false, pricing: false }, matches: () => false, normalizeConfig: (config) => config };\n");
await writeFile(join(duplicateDir, "second.js"), "export default { id: 'dup', capabilities: { balance: false, pricing: false }, matches: () => false, normalizeConfig: (config) => config };\n");
await assert.rejects(() => loadProviderAdapters(pathToFileURL(`${duplicateDir}/`)), /first\.js.*second\.js|second\.js.*first\.js/);

console.log("provider runtime ok");
