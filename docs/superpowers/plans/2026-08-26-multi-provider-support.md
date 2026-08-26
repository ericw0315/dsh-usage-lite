# Multi-provider Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an automatically discovered, one-file-per-provider adapter system for seven providers, with safe DeepSeek balance lookup and honest multi-currency public-price estimates.

**Architecture:** `lib/provider-runtime.js` loads and validates provider modules, matches DSH configurations, and normalizes optional balance and pricing capabilities. Seven focused files under `lib/providers/` own provider facts, while `lib/index.js` remains responsible for DSH discovery, event aggregation, and HTTP routes; `lib/client.js` renders normalized balances and separate CNY/USD estimates.

**Tech Stack:** Node.js ESM, built-in `node:fs/promises` and `node:url`, DSH Cordis plugin APIs, React 18 bundled client, `node:assert/strict` script tests, npm scripts.

**Spec:** `docs/superpowers/specs/2026-08-26-multi-provider-support-design.md`

## Global Constraints

- Adding a provider requires one new file under `lib/providers/`; shared runtime code contains no provider IDs, endpoints, model names, or prices.
- Support DeepSeek, OpenAI, Anthropic, Google Gemini, Alibaba Cloud Model Studio/Qwen, Zhipu BigModel, and MiniMax.
- Only DeepSeek performs a balance request; no new admin, organization, or cloud-billing credential types are introduced.
- Credentials stay server-side; browser responses never include raw upstream bodies, raw exceptions, authorization headers, or credential values.
- Unknown prices remain unknown and contribute to `unpricedTokens`; they never fall back to another model or provider.
- CNY and USD costs remain separate arrays and are never exchange-rate converted or numerically summed.
- First-release estimates cover text-generation token usage only; non-token image, audio, video, music, tools, and subscription-plan charges are excluded.
- Pricing is static reviewed source code with `sourceURL` and `verifiedAt: "2026-08-26"`; there is no runtime scraping.
- HTTP routes remain GET-only and loopback-only.
- Use TDD for every behavior change and keep `npm test` and `npm run check` green.

---

### Task 1: Provider adapter runtime

**Files:**
- Create: `lib/provider-runtime.js`
- Create: `scripts/test-provider-runtime.mjs`
- Modify: `package.json:51-54`

**Interfaces:**
- Consumes: adapter objects with `id`, `capabilities`, `matches(config)`, `normalizeConfig(config)`, optional `fetchBalance(context)`, and optional `resolvePrice(context)`.
- Produces: `loadProviderAdapters(directoryURL?)`, `validateAdapter(adapter, filename)`, `matchProvider(adapters, config)`, `normalizeProvider(adapters, config)`, `fetchProviderBalance(adapter, config, dependencies)`, and `resolveProviderPrice(adapter, context)`.

- [ ] **Step 1: Write runtime contract failures**

Create `scripts/test-provider-runtime.mjs` with assertions for deterministic loading, duplicate IDs, invalid capability declarations, exact one/no/multiple matches, safe balance error normalization, and unknown pricing:

```js
import assert from "node:assert/strict";
import {
  validateAdapter,
  matchProvider,
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
assert.deepEqual(resolveProviderPrice(null, { usage: { inputTokens: 3 } }), { status: "unknown", unpricedTokens: 3 });

const failed = await fetchProviderBalance({
  ...base,
  capabilities: { balance: true, pricing: true },
  fetchBalance: async () => { throw new Error("secret upstream body"); }
}, { id: "sample" }, { now: () => 123 });
assert.equal(failed.error, "upstream-error");
assert.equal(JSON.stringify(failed).includes("secret upstream body"), false);
```

- [ ] **Step 2: Run the runtime test and verify failure**

Run: `node scripts/test-provider-runtime.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/provider-runtime.js`.

- [ ] **Step 3: Implement the runtime**

Create `lib/provider-runtime.js` using `readdir`, `fileURLToPath`, and dynamic `import()` for sorted `.js` files. Implement these exact result conventions:

```js
export function tokenCountOf(usage) {
  return ["inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"]
    .reduce((total, key) => total + Math.max(0, Number(usage?.[key]) || 0), 0);
}

export function resolveProviderPrice(adapter, context) {
  const unpricedTokens = tokenCountOf(context?.usage);
  if (!adapter?.capabilities?.pricing) return { status: "unknown", unpricedTokens };
  const quote = adapter.resolvePrice(context);
  return quote?.status === "priced" || quote?.status === "partial"
    ? quote
    : { status: "unknown", unpricedTokens };
}
```

`fetchProviderBalance` returns shared account fields plus one of `unsupported`, `not-configured`, `upstream-error`, or `invalid-response`. It catches adapter exceptions without serializing their messages. `loadProviderAdapters()` freezes the sorted adapter list and rejects duplicate IDs with both filenames in the error text.

- [ ] **Step 4: Add the runtime test to npm scripts and run it**

Modify `package.json` so `check` includes `node --check lib/provider-runtime.js && node --check scripts/test-provider-runtime.mjs`, and `test` runs `node scripts/test-provider-runtime.mjs` before server tests.

Run: `npm run check && node scripts/test-provider-runtime.mjs`
Expected: syntax checks pass and output ends with `provider runtime ok`.

- [ ] **Step 5: Commit the runtime**

```bash
git add lib/provider-runtime.js scripts/test-provider-runtime.mjs package.json
git commit -m "feat: add provider adapter runtime"
```

---

### Task 2: DeepSeek adapter and balance migration

**Files:**
- Create: `lib/providers/deepseek.js`
- Create: `scripts/test-providers.mjs`
- Modify: `lib/index.js:7-18,199-292`
- Modify: `package.json:51-54`
- Test: `scripts/test-server.mjs`

**Interfaces:**
- Consumes: runtime functions from Task 1.
- Produces: DeepSeek adapter and `collectProviderAccounts(ctx, adapters)` using adapter matching instead of `provider.id` branches.

- [ ] **Step 1: Write failing DeepSeek adapter tests**

Create `scripts/test-providers.mjs` and directly import `deepseek.js`. Assert matching, normalization, current/legacy model behavior, successful balance parsing, missing credential, and invalid payload:

```js
import assert from "node:assert/strict";
import deepseek from "../lib/providers/deepseek.js";

assert.equal(deepseek.matches({ id: "deepseek-official" }), true);
assert.equal(deepseek.matches({ id: "custom", baseURL: "https://api.deepseek.com/v1" }), true);
assert.equal(deepseek.matches({ id: "custom", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(deepseek.normalizeConfig({ id: "deepseek-official" }), {
  id: "deepseek-official",
  adapterId: "deepseek",
  displayName: "DeepSeek",
  baseURL: "https://api.deepseek.com",
  apiKeyEnv: "DEEPSEEK_API_KEY"
});

const balance = await deepseek.fetchBalance({
  config: deepseek.normalizeConfig({ id: "deepseek-official" }),
  resolveCredential: async () => ({ value: "sk-test" }),
  fetch: async () => ({ ok: true, json: async () => ({ balance_infos: [{ total_balance: "12.5", granted_balance: "2.5", topped_up_balance: "10", currency: "CNY" }] }) }),
  now: () => 123
});
assert.equal(balance.balance.remaining, 12.5);
assert.equal(balance.fetchedAt, 123);
```

Include current public DeepSeek V4 model cases and regression cases for the existing `deepseek-chat` and `deepseek-reasoner` aliases. Peak/off-peak pricing must use `occurredAt` UTC; boundary assertions cover 01:00, 04:00, 06:00, and 10:00 UTC on weekdays.

- [ ] **Step 2: Run provider tests and verify failure**

Run: `node scripts/test-providers.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/providers/deepseek.js`.

- [ ] **Step 3: Implement the DeepSeek adapter**

Move the default account, official hostname recognition, `/user/balance` request, response validation, and price data to `lib/providers/deepseek.js`. Join paths without producing duplicate slashes, send `Authorization: Bearer <key>`, and throw typed errors with codes only:

```js
const invalidResponse = () => Object.assign(new Error("invalid-response"), { code: "invalid-response" });

export default {
  id: "deepseek",
  capabilities: { balance: true, pricing: true },
  matches,
  normalizeConfig,
  fetchBalance,
  resolvePrice
};
```

Price results include `currency: "USD"` for current V4 public prices, `pricingBasis`, `source.url`, and `source.verifiedAt`. Preserve existing DeepSeek chat/reasoner estimates as explicit legacy aliases with CNY metadata so the feature does not regress for existing sessions; do not use them as a fallback for unknown models.

- [ ] **Step 4: Migrate account collection in `lib/index.js`**

Load adapters once in `apply(ctx)`, pass the frozen list to account and billing collection, and replace `fetchDeepSeekBalance`, `unsupportedProvider`, and the provider-ID conditional with:

```js
async function collectProviderAccounts(ctx, adapters) {
  return Promise.all(configuredProviders(ctx).map(async (raw) => {
    const adapter = matchProvider(adapters, raw);
    const provider = adapter ? adapter.normalizeConfig(raw) : raw;
    return fetchProviderBalance(adapter, provider, {
      resolveCredential: (name) => ctx.credentials?.resolve?.(name),
      fetch: globalThis.fetch,
      now: () => Date.now()
    });
  }));
}
```

Keep the route schema fields used by the current client: `id`, `displayName`, `supported`, `configured`, `fetchedAt`, `balance`, and safe `error` code.

- [ ] **Step 5: Run DeepSeek and route tests**

Run: `node scripts/test-providers.mjs && node scripts/test-server.mjs`
Expected: both pass; existing DeepSeek balance request count remains one and unsupported providers make no requests.

- [ ] **Step 6: Register tests and commit**

Add `node --check` and test execution for `lib/providers/deepseek.js` and `scripts/test-providers.mjs` to `package.json`.

```bash
git add lib/providers/deepseek.js lib/index.js scripts/test-providers.mjs scripts/test-server.mjs package.json
git commit -m "refactor: move DeepSeek into provider adapter"
```

---

### Task 3: USD pricing adapters

**Files:**
- Create: `lib/providers/openai.js`
- Create: `lib/providers/anthropic.js`
- Create: `lib/providers/gemini.js`
- Modify: `scripts/test-providers.mjs`
- Modify: `package.json:51-54`

**Interfaces:**
- Consumes: adapter contract and `tokenCountOf(usage)` from Task 1.
- Produces: three pricing-only adapters returning USD `priced`, `partial`, or `unknown` quotes.

- [ ] **Step 1: Add failing matching and pricing tests**

Extend `scripts/test-providers.mjs` with direct imports and a shared contract assertion:

```js
function assertPricingOnly(adapter) {
  assert.deepEqual(adapter.capabilities, { balance: false, pricing: true });
  assert.equal("fetchBalance" in adapter, false);
}

const usage = { inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 0, cacheWriteTokens: 0 };
assert.equal(openai.resolvePrice({ model: "gpt-5.6-luna", usage, occurredAt: Date.UTC(2026, 7, 26) }).currency, "USD");
assert.equal(anthropic.resolvePrice({ model: "claude-sonnet-5", usage, occurredAt: Date.UTC(2026, 7, 26) }).amount, 12);
assert.equal(gemini.resolvePrice({ model: "gemini-2.5-flash", usage, occurredAt: Date.UTC(2026, 7, 26) }).status, "priced");
assert.equal(openai.resolvePrice({ model: "private-model", usage }).status, "unknown");
```

Test official domains, explicit aliases, custom-gateway non-matches, input tiers when the public rule and event data are sufficient, cache categories, metadata, and zero-token results.

- [ ] **Step 2: Run tests and verify failure**

Run: `node scripts/test-providers.mjs`
Expected: FAIL on the first missing USD adapter module.

- [ ] **Step 3: Implement `openai.js`**

Add official ID/domain matching, default configuration, and a pure price catalog. Include the current public flagship text models documented in the spec source, with explicit model aliases only. The adapter has no balance function. Return unknown for long-context or service-tier cases that cannot be selected from the local event, rather than assuming an undisclosed tier.

- [ ] **Step 4: Implement `anthropic.js`**

Cover current Claude Fable, Opus, Sonnet, and Haiku text families documented on 2026-08-26. Model entries distinguish input, 5-minute cache write, 1-hour cache write when the event can identify it, cache hit, and output. When DSH reports only aggregate `cacheWriteTokens` without TTL, use the documented 5-minute standard and set `pricingBasis: "current-public-price-partial-context"`.

- [ ] **Step 5: Implement `gemini.js`**

Cover public text-token prices for the commonly configured Gemini 2.5 Pro, Flash, and Flash-Lite IDs and documented aliases. Apply input-length tiers only from `usage.inputTokens`. Do not price search grounding, media token modalities, free-tier assumptions, or enterprise endpoints from generic usage events.

- [ ] **Step 6: Run tests and commit**

Add all three files to `package.json` syntax checks.

Run: `npm run check && node scripts/test-providers.mjs`
Expected: PASS and output ends with `providers ok`.

```bash
git add lib/providers/openai.js lib/providers/anthropic.js lib/providers/gemini.js scripts/test-providers.mjs package.json
git commit -m "feat: add USD provider pricing adapters"
```

---

### Task 4: CNY pricing adapters

**Files:**
- Create: `lib/providers/qwen.js`
- Create: `lib/providers/zhipu.js`
- Create: `lib/providers/minimax.js`
- Modify: `scripts/test-providers.mjs`
- Modify: `package.json:51-54`

**Interfaces:**
- Consumes: adapter contract from Task 1.
- Produces: three pricing-only adapters returning CNY quotes and no balance function.

- [ ] **Step 1: Add failing CNY adapter tests**

Add assertions for official aliases/domains, standard normalization, exact tier boundaries, cache categories, unknown models, and no balance capability. Representative cases:

```js
assert.equal(qwen.resolvePrice({
  model: "qwen-plus",
  usage: { inputTokens: 128_000, outputTokens: 1_000 }
}).currency, "CNY");

assert.equal(zhipu.resolvePrice({
  model: "glm-4.7",
  usage: { inputTokens: 32_000, outputTokens: 200 }
}).status, "priced");

assert.equal(minimax.resolvePrice({
  model: "MiniMax-M3",
  usage: { inputTokens: 512_000, outputTokens: 1_000, cacheReadTokens: 0 }
}).status, "priced");

for (const adapter of [qwen, zhipu, minimax]) {
  assert.equal(adapter.capabilities.balance, false);
  assert.equal("fetchBalance" in adapter, false);
}
```

Use tests immediately below and above every documented tier boundary to remove `<`/`≤` ambiguity.

- [ ] **Step 2: Run tests and verify failure**

Run: `node scripts/test-providers.mjs`
Expected: FAIL on the first missing CNY adapter module.

- [ ] **Step 3: Implement `qwen.js`**

Cover the current documented Qwen Max, Plus, Flash, Turbo, and Coder text families. Use input-token thresholds from the public table, distinguish thinking/non-thinking output only when the event exposes enough information, and otherwise choose the non-thinking standard while labeling the quote partial. Do not include free promotional quotas in cost estimates.

- [ ] **Step 4: Implement `zhipu.js`**

Cover GLM-5.3, GLM-5.2, GLM-5.1, GLM-5-Turbo, GLM-5, GLM-4.7, GLM-4.5-Air, GLM-4.7-FlashX, and GLM-4.7-Flash. Preserve documented zero prices as priced zero, handle input and output tiers, and include cache-hit prices when events report cache reads. Exclude temporary free cache-storage promotions because storage duration is absent from DSH events.

- [ ] **Step 5: Implement `minimax.js`**

Cover MiniMax-M3 at `≤512K` and `>512K`, MiniMax-M2.7, and MiniMax-M2.7-highspeed using the documented standard CNY token prices. Include cache-read and cache-write prices where published. Do not price the Priority mode without an event field proving that mode.

- [ ] **Step 6: Run tests and commit**

Add the three files to `package.json` syntax checks.

Run: `npm run check && node scripts/test-providers.mjs`
Expected: PASS.

```bash
git add lib/providers/qwen.js lib/providers/zhipu.js lib/providers/minimax.js scripts/test-providers.mjs package.json
git commit -m "feat: add CNY provider pricing adapters"
```

---

### Task 5: Multi-provider billing aggregation

**Files:**
- Modify: `lib/index.js:65-197,294-317`
- Modify: `scripts/test-server.mjs`

**Interfaces:**
- Consumes: `matchProvider(adapters, config)` and `resolveProviderPrice(adapter, { model, usage, occurredAt })`.
- Produces: `collectBilling(ctx, adapters)` with `{ tokens, costs, unpricedTokens }` at global, day, provider, and model levels.

- [ ] **Step 1: Replace single-cost test fixtures with mixed-currency failures**

Extend `testDetailAggregation()` to emit at least one event for every provider. Assert sorted cost arrays and unknown propagation:

```js
assert.deepEqual(body.billing.total.costs.map((row) => row.currency), ["CNY", "USD"]);
assert.equal(body.billing.total.costs.every((row) => Number.isFinite(row.amount)), true);
assert.ok(body.billing.total.unpricedTokens > 0);
assert.equal("cost" in body.billing.total, false);

const unknown = body.billing.providers.find((row) => row.id === "custom");
assert.equal(unknown.costs.length, 0);
assert.equal(unknown.unpricedTokens, unknown.tokens);
```

Add an explicit test showing `openai/private-model` is not priced using DeepSeek values and a mixed CNY/USD day is not collapsed into one number.

- [ ] **Step 2: Run the server test and verify failure**

Run: `node scripts/test-server.mjs`
Expected: FAIL because current results expose numeric `cost` and have no `costs` or `unpricedTokens`.

- [ ] **Step 3: Implement reusable money aggregation**

In `lib/index.js`, replace numeric cost accumulators with maps and helpers:

```js
function addQuote(target, quote) {
  target.unpricedTokens += quote.unpricedTokens ?? 0;
  if ((quote.status === "priced" || quote.status === "partial") && quote.currency) {
    target.costs.set(quote.currency, (target.costs.get(quote.currency) ?? 0) + (quote.amount ?? 0));
  }
}

function serializeCosts(costs) {
  return [...costs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => ({ currency, amount: Number(amount.toFixed(6)) }));
}
```

Every accumulator is initialized with `tokens: 0`, `costs: new Map()`, and `unpricedTokens: 0`. Serialization returns `costs` arrays at every level and removes the legacy numeric `cost`.

- [ ] **Step 4: Match billing events to adapters safely**

Create a minimal pricing configuration from event source provider ID and model prefix, call `matchProvider`, and pass the base model plus full usage and timestamp to the adapter. Provider attribution stays unchanged. Catch ambiguous matches as unknown pricing; one malformed provider must not fail the whole detail route.

- [ ] **Step 5: Run server and full tests**

Run: `node scripts/test-server.mjs && npm test`
Expected: server aggregation passes; the client smoke test now fails on the old numeric cost schema, which Task 6 addresses. All earlier runtime/provider tests remain green.

- [ ] **Step 6: Commit aggregation**

```bash
git add lib/index.js scripts/test-server.mjs
git commit -m "feat: aggregate multi-provider costs by currency"
```

---

### Task 6: Multi-currency client rendering

**Files:**
- Modify: `lib/client.js:145-152,167-201,345-520,780-853`
- Modify: `scripts/smoke-client.mjs:105-229`

**Interfaces:**
- Consumes: billing rows with `costs: Array<{currency, amount}>` and `unpricedTokens`.
- Produces: `fmtCosts(costs)`, updated `buildUsageHeatmap`, and UI rendering for separate currencies and unknown usage.

- [ ] **Step 1: Write failing formatter and rendering tests**

Require a new exported `fmtCosts` helper and update fixtures:

```js
if (typeof exports_.fmtCosts !== "function") throw new Error("missing multi-currency formatter");
const formatted = exports_.fmtCosts([
  { currency: "CNY", amount: 0.18 },
  { currency: "USD", amount: 0.04 }
]);
if (!formatted.includes("¥") || !formatted.includes("$") || !formatted.includes(" + ")) {
  throw new Error("must render separate CNY and USD estimates");
}
```

Change billing fixtures to `costs` arrays and `unpricedTokens`. Assert that markup contains the localized unknown-price notice and the token count, that zero-cost known usage renders as currency zero, and that empty costs with unpriced tokens do not render as free.

- [ ] **Step 2: Run client smoke test and verify failure**

Run: `node scripts/smoke-client.mjs`
Expected: FAIL with `missing multi-currency formatter`.

- [ ] **Step 3: Implement shared cost formatting**

Add and export:

```js
function fmtCosts(costs) {
  const rows = Array.isArray(costs) ? costs : [];
  return rows.length === 0
    ? "—"
    : rows.map(({ amount, currency }) => fmtCurrency(amount, currency)).join(" + ");
}
```

Use it for total, provider, model, heatmap title/ARIA label, and selected-day cost. Keep heatmap intensity based only on tokens.

- [ ] **Step 4: Render unpriced usage and update copy**

Add `billing.unpricedTokens` and `billing.unpricedNotice` in Chinese and English. Show the notice when `unpricedTokens > 0` at the global overview. Expand `billing.estimatedNotice` to mention list-price changes, tiers, discounts, regions, and incomplete event details without claiming invoice accuracy.

- [ ] **Step 5: Run client and full tests**

Run: `node scripts/smoke-client.mjs && npm test && npm run check`
Expected: all pass.

- [ ] **Step 6: Commit client changes**

```bash
git add lib/client.js scripts/smoke-client.mjs
git commit -m "feat: render multi-currency usage estimates"
```

---

### Task 7: Documentation, package verification, and final checks

**Files:**
- Modify: `README.md`
- Modify: `scripts/test-bundle.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: final adapter contract and UI behavior.
- Produces: contributor instructions, capability matrix, source disclosure, and packaging assertions.

- [ ] **Step 1: Write failing documentation/package assertions**

Extend `scripts/test-bundle.mjs`:

```js
for (const provider of ["deepseek", "openai", "anthropic", "gemini", "qwen", "zhipu", "minimax"]) {
  await access(join(root, "lib", "providers", `${provider}.js`));
}
const readme = await readFile(join(root, "README.md"), "utf8");
assert.ok(readme.includes("lib/providers/"));
assert.ok(readme.includes("unpricedTokens"));
assert.ok(readme.includes("MiniMax"));
assert.ok(readme.includes("智谱"));
```

- [ ] **Step 2: Run bundle test and verify failure**

Run: `node scripts/test-bundle.mjs`
Expected: FAIL because the README does not yet document the adapter path and unpriced token behavior.

- [ ] **Step 3: Update README**

Replace the DeepSeek-only capability table and price table with:

- Seven-provider discovery/pricing/balance capability matrix.
- Explanation of local usage estimates, multi-currency display, and unknown price behavior.
- Explicit statement that only DeepSeek makes a balance request.
- One-file adapter instructions listing the six contract members.
- First-release text-only pricing scope and exclusions.
- Public source links and `2026-08-26` verification date.
- Warning that prices are reviewed snapshots and actual invoices win.

- [ ] **Step 4: Finalize npm scripts and package coverage**

Ensure `check` syntax-checks `lib/provider-runtime.js`, all seven provider files, and all test scripts. Ensure `test` runs bundle, runtime, provider, server, and client tests exactly once.

- [ ] **Step 5: Run final verification**

Run: `npm run check && npm test && npm pack --dry-run`
Expected: all syntax/tests pass; dry-run package contents include `lib/provider-runtime.js` and all seven `lib/providers/*.js` files, and contain no credentials or local session data.

Run: `git diff --check && git status --short`
Expected: no whitespace errors; only planned README/test/package changes are present before commit.

- [ ] **Step 6: Commit documentation and verification**

```bash
git add README.md scripts/test-bundle.mjs package.json
git commit -m "docs: document multi-provider usage estimates"
```

- [ ] **Step 7: Record final evidence**

Run: `git status --short --branch && git log --oneline --decorate -8`
Expected: clean `multi-provider-support` branch with the design, plan, and implementation commits; report the exact `npm run check`, `npm test`, and `npm pack --dry-run` outcomes.
