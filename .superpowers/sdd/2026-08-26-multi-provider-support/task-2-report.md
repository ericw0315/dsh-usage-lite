# Task 2 Report: DeepSeek adapter and balance migration

## Implementation

- Added `lib/providers/deepseek.js` as the balance+pricing adapter for DeepSeek.
- Moved default DeepSeek account metadata into the adapter and reused its legacy compatibility price book from `lib/index.js`.
- Implemented official-host matching, config normalization, safe `/user/balance` fetching, typed adapter errors, and explicit pricing entries for:
  - current public `deepseek-v4-flash`
  - current public `deepseek-v4-pro`
  - legacy compatibility `deepseek-chat`
  - legacy compatibility `deepseek-reasoner`
- Migrated provider account collection in `lib/index.js` to use Task 1 runtime helpers:
  - `loadProviderAdapters()`
  - `normalizeProvider(adapters, config)`
  - `fetchProviderBalance(adapter, provider, dependencies)`
- Removed the old DeepSeek-specific balance branch and the raw error passthrough path.
- Removed the legacy `deepseek-chat` fallback from billing price lookup so unknown models are no longer silently priced with DeepSeek legacy estimates.
- Added direct adapter coverage in `scripts/test-providers.mjs`.
- Updated `scripts/test-server.mjs` to assert the safe `upstream-error` code.
- Registered the new adapter/test file in `package.json` `check` and `test`.

## Files

- `lib/providers/deepseek.js`
- `lib/index.js`
- `scripts/test-providers.mjs`
- `scripts/test-server.mjs`
- `package.json`

## TDD

### RED

Command:

```bash
node scripts/test-providers.mjs
```

Output:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../lib/providers/deepseek.js' imported from .../scripts/test-providers.mjs
```

Reason:

- Expected initial failure before the adapter existed.

### GREEN

Command:

```bash
node scripts/test-providers.mjs && node scripts/test-server.mjs
```

Output:

```text
providers ok
server ok
```

## Full Verification

Commands:

```bash
npm test
npm run check
```

Outputs:

```text
> dsh-usage-lite@0.1.1 test
> node scripts/test-provider-runtime.mjs && node scripts/test-providers.mjs && node scripts/test-bundle.mjs && node scripts/test-server.mjs && node scripts/smoke-client.mjs

provider runtime ok
providers ok
bundle ok
server ok
client ok
```

```text
> dsh-usage-lite@0.1.1 check
> node --check lib/index.js && node --check lib/client.js && node --check lib/provider-runtime.js && node --check lib/providers/deepseek.js && node --check scripts/test-bundle.mjs && node --check scripts/test-provider-runtime.mjs && node --check scripts/test-providers.mjs && node --check scripts/test-server.mjs && node --check scripts/smoke-client.mjs
```

## Self-Review

- The adapter returns only safe error codes (`not-configured`, `invalid-response`, `upstream-error`) and does not leak raw upstream details.
- Account discovery now goes through runtime normalization instead of bypassing it for DeepSeek.
- Unsupported providers still avoid network requests.
- The explicit legacy compatibility aliases remain available, but only by exact model match.
- Unknown models are no longer implicitly priced with `deepseek-chat`.

## Concerns

- Current DeepSeek V4 pricing is represented with the DSH-facing `deepseek-v4-flash` and `deepseek-v4-pro` model IDs while using verified public DeepSeek pricing metadata from August 26, 2026. If later tasks standardize different runtime model IDs, this adapter’s alias table may need to expand.

---

## Fix Round 1

### Findings Addressed

- High: billing in `lib/index.js` now resolves prices through provider adapters instead of the shared DeepSeek legacy price table.
- Low: unsupported listed accounts now preserve `configured: true`.

### Covering Test Files

- `scripts/test-provider-runtime.mjs`
- `scripts/test-providers.mjs`
- `scripts/test-server.mjs`

### RED

Commands:

```bash
node scripts/test-provider-runtime.mjs && node scripts/test-server.mjs
node scripts/test-server.mjs
```

Outputs:

```text
AssertionError [ERR_ASSERTION]:
+ actual - expected

  {
    adapterId: undefined,
    balance: null,
+   configured: false,
-   configured: true,
    displayName: 'Listed Provider',
    error: 'unsupported',
    id: 'listed',
    supported: false
  }
```

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

false !== true
```

Interpretation:

- Runtime still marked unsupported listed accounts as `configured: false`.
- Server route still exposed that incorrect account contract before the billing assertions could run.

### GREEN

Command:

```bash
node scripts/test-provider-runtime.mjs && node scripts/test-providers.mjs && node scripts/test-server.mjs
```

Output:

```text
provider runtime ok
providers ok
server ok
```

### Full Verification

Commands:

```bash
npm test
npm run check
```

Outputs:

```text
> dsh-usage-lite@0.1.1 test
> node scripts/test-provider-runtime.mjs && node scripts/test-providers.mjs && node scripts/test-bundle.mjs && node scripts/test-server.mjs && node scripts/smoke-client.mjs

provider runtime ok
providers ok
bundle ok
server ok
client ok
```

```text
> dsh-usage-lite@0.1.1 check
> node --check lib/index.js && node --check lib/client.js && node --check lib/provider-runtime.js && node --check lib/providers/deepseek.js && node --check scripts/test-bundle.mjs && node --check scripts/test-provider-runtime.mjs && node --check scripts/test-providers.mjs && node --check scripts/test-server.mjs && node --check scripts/smoke-client.mjs
```

### Implementation Notes

- Removed the shared DeepSeek price-book dependency from `lib/index.js`.
- Added adapter-driven billing resolution via `matchProvider()` + `resolveProviderPrice()`.
- Added transitional `costs` and `unpricedTokens` to total/day/provider/model billing rows.
- Preserved legacy numeric `cost` as a CNY-only subtotal for client compatibility.
- Kept unknown-model usage out of numeric `cost` and routed it into `unpricedTokens`.
- Restored `configured: true` for unsupported listed accounts in `fetchProviderBalance()`.

### Self-Review

- Current V4 DeepSeek USD pricing is now visible from the detail route and covered by assertions.
- Legacy DeepSeek CNY totals remain available through numeric `cost`, which keeps the current client and smoke test stable for this round.
- Unknown provider/model traffic no longer falls through to DeepSeek legacy pricing.
- The transitional schema is intentionally additive: old `cost` remains, while `costs` and `unpricedTokens` are available for the later client migration.
