# Multi-provider support design

Date: 2026-08-26  
Status: Approved in conversation  
Branch: `multi-provider-support`

## Summary

`dsh-usage-lite` currently discovers multiple configured providers, but its balance lookup and price book are hard-coded for DeepSeek. This change introduces a provider adapter system so that adding a provider requires one new file implementing a small, validated interface. The shared server and client flows will not contain provider-specific branches.

The first release supports DeepSeek, OpenAI, Anthropic, Google Gemini, Alibaba Cloud Model Studio (Qwen), Zhipu BigModel, and MiniMax for provider discovery, local token aggregation, and public-price cost estimates. DeepSeek remains the only provider with balance lookup because it is the only provider in this scope with a documented balance endpoint accessible using the normal model API key.

## Goals

- Add a provider by creating one file under `lib/providers/`.
- Keep provider matching, configuration defaults, balance parsing, and model pricing inside that provider file.
- Automatically discover and validate provider adapters at runtime.
- Estimate text-generation token costs using documented public prices.
- Represent CNY and USD costs separately without implicit currency conversion.
- Report unknown and partially priced usage explicitly.
- Preserve the existing local-only HTTP boundary and server-side credential handling.
- Make adapters and the shared runtime independently testable.

## Non-goals

- Querying provider invoices or replacing provider billing consoles.
- Adding admin, cloud-account, or billing credentials to the plugin.
- Estimating image, audio, video, music, subscription-plan, or tool-call charges in the first release.
- Scraping live pricing pages at runtime.
- Converting currencies or maintaining exchange rates.
- Guaranteeing that estimates match discounts, promotions, negotiated contracts, taxes, regional premiums, or provider invoices.

## Considered approaches

### Automatic adapter discovery — selected

The runtime scans `lib/providers/*.js`, imports every module in deterministic filename order, and validates each default export. A new provider requires one file and tests. The package already publishes all of `lib/`, so provider files are included without a separate build manifest.

This approach directly meets the one-file extension requirement. Its additional filesystem work happens once during plugin initialization and is negligible for the expected number of adapters.

### Central registry

A registry with explicit imports is simpler to inspect, but every provider addition also edits the registry. That violates the requested extension model and creates a recurring merge-conflict point.

### Self-registering packages

Separate packages could register themselves through package metadata or side effects. This would support third-party adapters, but it introduces dependency discovery, version compatibility, and security policy that the current plugin does not need.

## File organization

```text
lib/
  index.js
  provider-runtime.js
  providers/
    deepseek.js
    openai.js
    anthropic.js
    gemini.js
    qwen.js
    zhipu.js
    minimax.js
  client.js

scripts/
  test-provider-runtime.mjs
  test-providers.mjs
  test-server.mjs
  smoke-client.mjs
```

`provider-runtime.js` contains no provider IDs, model names, official endpoints, or price values. Provider-specific facts live only in the corresponding adapter.

## Adapter contract

Every file in `lib/providers/` default-exports an object with this shape:

```js
export default {
  id: "openai",
  capabilities: {
    balance: false,
    pricing: true
  },

  matches(providerConfig) {},
  normalizeConfig(providerConfig) {},

  async fetchBalance({ config, resolveCredential, fetch, now }) {},
  resolvePrice({ model, usage, occurredAt }) {}
};
```

The two capability functions are optional. `capabilities.balance` is true exactly when `fetchBalance` exists, and `capabilities.pricing` is true exactly when `resolvePrice` exists. Validation rejects inconsistent declarations.

### `id`

A stable internal adapter identity such as `deepseek`, `openai`, or `minimax`. It is used for diagnostics and tests, not as the configured account ID or display name. Duplicate IDs fail adapter loading and identify both conflicting files.

### `capabilities`

Declares optional functionality without requiring callers to inspect function presence. This lets the UI distinguish unsupported functionality from missing credentials or upstream failures.

### `matches(providerConfig)`

Purely determines whether the adapter owns a discovered DSH provider configuration. It may examine the configured ID, an explicit provider type, and the normalized hostname of `baseURL`. It must not resolve credentials, make network requests, or infer ownership from a model name alone.

Official provider IDs and domains are recognized. For custom OpenAI-compatible gateways, an explicit provider ID takes precedence; a gateway is not silently labeled OpenAI merely because it implements the OpenAI protocol.

If no adapter matches, the provider remains visible and its local token usage remains aggregated, but balance is unsupported and price is unknown. If multiple adapters match, the runtime reports an `ambiguous-adapter` diagnostic rather than selecting one by load order.

### `normalizeConfig(providerConfig)`

Converts DSH configuration into the shared account shape:

```js
{
  id: "openai-main",
  adapterId: "openai",
  displayName: "OpenAI Main",
  baseURL: "https://api.openai.com/v1",
  apiKeyEnv: "OPENAI_API_KEY"
}
```

It may apply the provider's documented default base URL and credential reference. It never resolves or returns a credential value.

### `fetchBalance(context)`

An optional asynchronous balance capability. The runtime supplies only the normalized configuration, a credential resolver, the fetch implementation, and a clock. The adapter resolves the configured credential, calls a documented endpoint, validates the response, and returns a shared balance value.

In the first release, only DeepSeek implements this method using `GET /user/balance`. Other adapters do not accept additional admin or cloud-billing credentials, so an ordinary model key cannot accidentally gain broader account access.

### `resolvePrice(context)`

An optional pure pricing capability. It matches the provider's model aliases and documented pricing rules using the usage event and occurrence time. It returns a price quote or an explicit unknown result. It does not perform network access.

The function may account for input/output tiers and cache categories only when the session event contains the facts needed to select a price. Missing facts produce a partial or unknown estimate instead of an invented default.

## Adapter loading and lifecycle

Adapter loading occurs once during plugin initialization:

1. Resolve `lib/providers/` relative to `provider-runtime.js`.
2. Read regular `.js` files and sort them by filename.
3. Dynamically import each file.
4. Validate the default export and capability consistency.
5. Reject duplicate adapter IDs.
6. Freeze the loaded adapter list for the plugin lifetime.

Loading errors include the adapter filename and a safe reason. They do not include environment values or credentials.

The runtime exposes small functions for loading adapters, matching one adapter to a configuration, normalizing accounts, fetching an account balance, and resolving a model price. Tests can inject an adapter list and do not depend on filesystem scanning.

## Provider discovery and matching

The existing discovery sources remain:

- The official DeepSeek configuration from `llm-deepseek`.
- Additional accounts from `llm-pi-ai.providers`.

DeepSeek's synthetic default account remains available for backward compatibility, but it is normalized by `deepseek.js` rather than special-cased in `index.js`.

Matching uses configured identity and official hostnames. Expected aliases include:

- DeepSeek: `deepseek`, `deepseek-official`, `api.deepseek.com`.
- OpenAI: `openai`, `api.openai.com`.
- Anthropic: `anthropic`, `claude`, `api.anthropic.com`.
- Gemini: `gemini`, `google`, official Gemini Developer API hosts.
- Qwen: `qwen`, `dashscope`, `aliyun`, official Model Studio hosts.
- Zhipu: `zhipu`, `bigmodel`, `open.bigmodel.cn`.
- MiniMax: `minimax` and official MiniMax API hosts.

Exact alias lists and default endpoints belong to adapter tests. Custom account IDs continue to work when their official `baseURL` identifies the provider.

## Balance result and errors

A supported successful lookup returns:

```js
{
  status: "available",
  fetchedAt: 1787702400000,
  balance: {
    remaining: 12.5,
    granted: 2.5,
    toppedUp: 10,
    currency: "CNY"
  }
}
```

Other states are represented using safe codes:

- `unsupported`: the adapter does not expose balance lookup.
- `not-configured`: the expected credential reference cannot be resolved.
- `upstream-error`: the documented endpoint returned a failure or could not be reached.
- `invalid-response`: the endpoint returned an unrecognized successful payload.
- `ambiguous-adapter`: more than one adapter matched the account.

The response may contain a localized user-facing category but never returns the credential, request authorization headers, raw upstream response, or raw exception string. Failed refreshes continue to preserve the last successful balance and fetch time on the client.

## Pricing model

Price data is maintained in the provider adapter alongside metadata:

```js
{
  model: "gpt-5.6-luna",
  currency: "USD",
  unitTokens: 1_000_000,
  input: 0.2,
  output: 1.2,
  cacheRead: 0.02,
  cacheWrite: 0.25,
  effectiveFrom: null,
  effectiveTo: null,
  sourceURL: "https://developers.openai.com/api/docs/pricing",
  verifiedAt: "2026-08-26"
}
```

`effectiveFrom` and `effectiveTo` are set only when a trustworthy public source establishes those dates. Otherwise the current public price may be used as an estimate for local events and is labeled `current-public-price`; it is not presented as historical invoice truth.

A resolved quote has this shape:

```js
{
  status: "priced",
  currency: "USD",
  amount: 0.0123,
  breakdown: {
    input: 0.002,
    output: 0.01,
    cacheRead: 0.0003,
    cacheWrite: null
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
}
```

Unknown models return `status: "unknown"`, the token count in `unpricedTokens`, and no numeric amount. A partially supported usage breakdown returns `status: "partial"`, prices the supported token categories, and reports unsupported categories in `unpricedTokens`. Numeric zero is reserved for usage that is known to be free.

## Supported pricing scope

The initial catalogs cover commonly configured text-generation models in these families:

- Current documented DeepSeek text models.
- Current documented OpenAI flagship and commonly used text models.
- Current documented Anthropic Claude text models.
- Current documented Gemini text models.
- Current documented Qwen Max, Plus, Flash, Turbo, and Coder text families.
- Zhipu GLM-5.x, GLM-4.7, GLM-4.5-Air, and Flash text families.
- MiniMax-M3, MiniMax-M2.7, and MiniMax-M2.7-highspeed.

Catalog entries are limited to prices that can be represented from DSH's local usage events. Provider-specific regional, batch, priority, fast-mode, subscription, promotional, and tool charges are included only when the event data unambiguously identifies the applicable rule. Otherwise the estimate uses the documented standard token rate and discloses that basis, or returns partial/unknown when no honest standard estimate is possible.

## Billing aggregation API

The current single numeric `cost` cannot represent mixed CNY and USD. Billing totals, provider totals, model totals, and daily totals move to this shape:

```js
{
  tokens: 12000,
  costs: [
    { currency: "CNY", amount: 0.18 },
    { currency: "USD", amount: 0.04 }
  ],
  unpricedTokens: 350
}
```

Costs are sorted by currency code and rounded only during serialization. Internal aggregation retains full JavaScript numeric precision consistent with the current implementation.

The server continues to group usage by UTC date, configured provider/source ID, and base model ID. It uses the source provider when present, then the existing model-prefix fallback for attribution. Provider attribution and pricing adapter selection remain separate: an unmatched provider can be shown without receiving another provider's price.

The summary and detail routes remain unchanged. Their internal response schema evolves together with the bundled client. The client continues to tolerate failed detail refreshes and stale cached assets as documented in the existing installation guidance.

## Client behavior

The balance view keeps its current behavior. Only accounts whose adapter supports balance lookup can be selected for the collapsed balance summary. Unsupported providers remain visible with an explicit message.

The usage view displays estimated costs per currency, for example `¥0.18 + $0.04`. It also displays an unpriced-token notice when any usage could not be priced. Provider, model, daily, and selected-day rows use the same formatter and never sum currencies.

The existing estimate disclaimer is expanded to state that public list prices may differ from provider invoices because of price changes, tiers, discounts, regions, service modes, and missing event details.

## Security and privacy

- Credentials are resolved only on the server and only by balance-capable adapters.
- Pricing functions never receive credential resolvers or credential values.
- Browser responses expose normalized account state and aggregate usage only.
- Upstream response bodies and raw exceptions are not returned to the browser.
- The local HTTP endpoints remain GET-only and loopback-only.
- The plugin performs no runtime price scraping, telemetry, or third-party usage upload.
- Only DeepSeek receives an outbound balance request in the first release.

## Testing strategy

### Runtime tests

- Deterministic adapter discovery.
- Invalid exports, missing required functions, and capability mismatches.
- Duplicate IDs and ambiguous matches.
- Unknown-provider fallback.
- Safe normalization of adapter failures.

### Adapter contract tests

- Expected ID and official-domain matches for all seven adapters.
- No false match for representative custom OpenAI-compatible gateways.
- Normalized default endpoints and credential references.
- Representative model aliases and unknown-model behavior.
- Input-length tier boundaries and output tiers where documented.
- Cache-read and cache-write categories where local events distinguish them.
- Source URL, currency, and verification metadata.
- DeepSeek balance success, missing credential, upstream error, and invalid payload.
- Confirmation that the other six adapters do not issue balance requests.

### Aggregation and client tests

- Mixed events across all seven providers.
- Separate CNY and USD totals at model, provider, day, and global levels.
- Partial and unknown price propagation through every aggregation level.
- No fallback from an unknown model to DeepSeek or any other price.
- Provider list, collapsed balance selection, multi-currency formatting, and unpriced-token notices.
- Preservation of the last successful balance after refresh failure.
- Loopback-only route enforcement and absence of credential data in responses.

The existing `npm test` and `npm run check` commands remain the required verification entry points and include the new test scripts.

## Documentation and maintenance

The README will document:

- The seven supported providers and capability matrix.
- The distinction between local usage estimation and provider billing.
- Multi-currency and unpriced-token behavior.
- How to add an adapter by creating one file and its tests.
- The adapter contract and security restrictions.
- Public pricing sources and their verification dates.

Provider price metadata is intentionally reviewable source code rather than remotely mutable data. Updating prices is a normal tested release change.

## Public sources verified for this design

All sources below were inspected on 2026-08-26:

- DeepSeek balance: <https://api-docs.deepseek.com/api/get-user-balance/>
- DeepSeek pricing: <https://api-docs.deepseek.com/quick_start/pricing/>
- OpenAI pricing: <https://developers.openai.com/api/docs/pricing>
- OpenAI organization usage and costs: <https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage>
- Anthropic pricing: <https://platform.claude.com/docs/en/about-claude/pricing>
- Anthropic Usage and Cost API: <https://platform.claude.com/docs/en/manage-claude/usage-cost-api>
- Gemini pricing: <https://ai.google.dev/gemini-api/docs/pricing>
- Alibaba Cloud Model Studio pricing: <https://help.aliyun.com/zh/model-studio/model-pricing>
- Zhipu pricing: <https://bigmodel.cn/pricing>
- Zhipu model documentation: <https://docs.bigmodel.cn/cn/guide/models/text/glm-4.5>
- MiniMax pay-as-you-go pricing: <https://platform.minimaxi.com/docs/guides/pricing-paygo>

The public OpenAI and Anthropic cost APIs require organization-level administrative credentials, not ordinary model API keys. Gemini and Alibaba Cloud billing belong to separate account/cloud billing systems. No documented ordinary-key balance endpoint was found for Zhipu or MiniMax. Those facts define the first-release balance capability boundary; the design can add a future optional billing capability without changing the adapter-loading architecture.
