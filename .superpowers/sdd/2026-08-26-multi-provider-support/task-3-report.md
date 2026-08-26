# Task 3 Report: USD pricing adapters

## Implementation

- Added pricing-only adapters:
  - `lib/providers/openai.js`
  - `lib/providers/anthropic.js`
  - `lib/providers/gemini.js`
- Extended `scripts/test-providers.mjs` with contract, matching, normalization, pricing, partial, unknown, tier-boundary, metadata, and zero-token assertions for the three USD adapters.
- Updated `package.json` `check` script to syntax-check the new provider files.

## TDD

### RED

Command:

```bash
node scripts/test-providers.mjs
```

Output:

```text
node:internal/modules/esm/resolve:271
    throw new ERR_MODULE_NOT_FOUND(
          ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/enbowang/deepseek-harness/my-plugin/dsh-usage-lite/.worktrees/multi-provider-support/lib/providers/anthropic.js' imported from /Users/enbowang/deepseek-harness/my-plugin/dsh-usage-lite/.worktrees/multi-provider-support/scripts/test-providers.mjs
...
Node.js v24.16.0
```

### GREEN

Command:

```bash
node scripts/test-providers.mjs
```

Output:

```text
providers ok
```

## Full verification

Command:

```bash
npm run check
```

Output:

```text
> dsh-usage-lite@0.1.1 check
> node --check lib/index.js && node --check lib/client.js && node --check lib/provider-runtime.js && node --check lib/providers/deepseek.js && node --check lib/providers/openai.js && node --check lib/providers/anthropic.js && node --check lib/providers/gemini.js && node --check scripts/test-bundle.mjs && node --check scripts/test-provider-runtime.mjs && node --check scripts/test-providers.mjs && node --check scripts/test-server.mjs && node --check scripts/smoke-client.mjs
```

Command:

```bash
npm test
```

Output:

```text
> dsh-usage-lite@0.1.1 test
> node scripts/test-provider-runtime.mjs && node scripts/test-providers.mjs && node scripts/test-bundle.mjs && node scripts/test-server.mjs && node scripts/smoke-client.mjs

provider runtime ok
providers ok
bundle ok
server ok
client ok
```

## Self-review

- The three new adapters follow the pricing-only contract: `capabilities = { balance: false, pricing: true }`, no `fetchBalance`, and provider-local price catalogs only.
- OpenAI quotes always use `pricingBasis: "current-public-price-partial-context"` because the captured public source includes long-context pricing columns without a safe event-side selector.
- Anthropic uses the documented 5-minute cache-write rate when `cacheWriteTokens > 0` and marks the quote basis as partial-context.
- Gemini treats `cacheWriteTokens` as unsupported, returns `status: "partial"`, sets `breakdown.cacheWrite = null`, and propagates those tokens to `unpricedTokens`.
- Model matching is case-insensitive and strips any provider path prefix before lookup.
- No runtime scraping, no credential access, and no balance behavior were added to the USD adapters.

## Concerns

- Event pricing currently receives only `providerId` plus model/usage. If future DSH usage events emit custom source provider IDs like `openai-main` without an `openai/...` model prefix, adapter selection for pricing may need additional runtime context beyond the current task scope.

## Fix Round 1

### Covered files

- `lib/index.js`
- `lib/providers/openai.js`
- `lib/providers/anthropic.js`
- `lib/providers/gemini.js`
- `scripts/test-providers.mjs`
- `scripts/test-server.mjs`

### Changes

- Built a configured-account adapter map from `configuredProviders(ctx)` via `normalizeProvider(adapters, raw)` and used it during billing price resolution.
- Billing now resolves event pricing by exact `message.source.provider` account ID first, then falls back to the existing bare alias match path.
- Removed arbitrary slash stripping from the OpenAI, Anthropic, and Gemini model normalizers; matching is now trim + lowercase only.
- Added direct negative adapter tests for namespaced/custom model strings staying `unknown`.
- Added server integration coverage for a custom configured official OpenAI account receiving USD pricing and a custom gateway account remaining unpriced.

### RED

Command:

```bash
node scripts/test-providers.mjs
```

Output:

```text
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

  {
+   amount: 1.67,
+   breakdown: {
+     cacheRead: 0.02,
+     cacheWrite: 0.25,
+     input: 0.2,
+     output: 1.2
+   },
+   currency: 'USD',
+   pricingBasis: 'current-public-price-partial-context',
+   source: {
+     url: 'https://developers.openai.com/api/docs/pricing',
+     verifiedAt: '2026-08-26'
+   },
+   status: 'priced',
+   unpricedTokens: 0
-   status: 'unknown',
-   unpricedTokens: 4000000
  }
...
Node.js v24.16.0
```

Command:

```bash
node scripts/test-server.mjs
```

Output:

```text
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

+ []
- [
-   {
-     amount: 1.67,
-     currency: 'USD'
-   }
- ]
...
Node.js v24.16.0
```

### GREEN

Command:

```bash
node scripts/test-providers.mjs
```

Output:

```text
providers ok
```

Command:

```bash
node scripts/test-server.mjs
```

Output:

```text
server ok
```

### Full verification

Command:

```bash
npm run check
```

Output:

```text
> dsh-usage-lite@0.1.1 check
> node --check lib/index.js && node --check lib/client.js && node --check lib/provider-runtime.js && node --check lib/providers/deepseek.js && node --check lib/providers/openai.js && node --check lib/providers/anthropic.js && node --check lib/providers/gemini.js && node --check scripts/test-bundle.mjs && node --check scripts/test-provider-runtime.mjs && node --check scripts/test-providers.mjs && node --check scripts/test-server.mjs && node --check scripts/smoke-client.mjs
```

Command:

```bash
npm test
```

Output:

```text
> dsh-usage-lite@0.1.1 test
> node scripts/test-provider-runtime.mjs && node scripts/test-providers.mjs && node scripts/test-bundle.mjs && node scripts/test-server.mjs && node scripts/smoke-client.mjs

provider runtime ok
providers ok
bundle ok
server ok
client ok
```

### Self-review

- The billing path now honors configured official account IDs without exposing provider config or credentials in billing output.
- Unsupported configured gateways still remain unpriced because the exact-ID lookup returns `null` and the alias fallback does not match arbitrary account IDs.
- Adapter model lookup now requires the post-`modelOf()` value to be an explicit known alias, avoiding accidental pricing of custom namespaced strings.
- Earlier multi-currency and unknown-token behavior remained green under the full suite.
