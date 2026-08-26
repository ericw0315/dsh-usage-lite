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
