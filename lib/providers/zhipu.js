import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOST = "open.bigmodel.cn";
const PRICING_URL = "https://bigmodel.cn/pricing";
const VERIFIED_AT = "2026-08-26";
const UNIT_TOKENS = 1_000_000;
const INPUT_TIER_THRESHOLD = 32_000;
const OUTPUT_TIER_THRESHOLD = 200;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "zhipu",
  displayName: "Zhipu",
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  apiKeyEnv: "ZHIPU_API_KEY"
});

const SOURCE = Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT });

const FIXED_PRICE_BOOK = Object.freeze({
  "glm-5.3": Object.freeze({ input: 8, output: 28, cacheRead: 2 }),
  "glm-5.2": Object.freeze({ input: 8, output: 28, cacheRead: 2 }),
  "glm-4.7-flashx": Object.freeze({ input: 0.5, output: 3, cacheRead: 0.1 }),
  "glm-4.7-flash": Object.freeze({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
});

function trimString(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function hostOf(baseURL) {
  const value = trimString(baseURL);
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeBaseURL(baseURL) {
  const value = trimString(baseURL) ?? DEFAULT_ACCOUNT.baseURL;
  return value.replace(/\/+$/, "");
}

function normalizedModel(model) {
  const value = trimString(model);
  return value ? value.toLowerCase() : null;
}

function amountOf(tokens, rate) {
  return (Math.max(0, Number(tokens) || 0) / UNIT_TOKENS) * rate;
}

function tieredRates(model, usage) {
  const inputTokens = Math.max(0, Number(usage?.inputTokens) || 0);
  const outputTokens = Math.max(0, Number(usage?.outputTokens) || 0);

  if (model === "glm-5.1") {
    return inputTokens < INPUT_TIER_THRESHOLD
      ? { input: 6, output: 24, cacheRead: 1.3 }
      : { input: 8, output: 28, cacheRead: 2 };
  }
  if (model === "glm-5-turbo") {
    return inputTokens < INPUT_TIER_THRESHOLD
      ? { input: 5, output: 22, cacheRead: 1.2 }
      : { input: 7, output: 26, cacheRead: 1.8 };
  }
  if (model === "glm-5") {
    return inputTokens < INPUT_TIER_THRESHOLD
      ? { input: 4, output: 18, cacheRead: 1 }
      : { input: 6, output: 22, cacheRead: 1.5 };
  }
  if (model === "glm-4.7") {
    if (inputTokens >= INPUT_TIER_THRESHOLD) return { input: 4, output: 16, cacheRead: 0.8 };
    return outputTokens < OUTPUT_TIER_THRESHOLD
      ? { input: 2, output: 8, cacheRead: 0.4 }
      : { input: 3, output: 14, cacheRead: 0.6 };
  }
  if (model === "glm-4.5-air") {
    if (inputTokens >= INPUT_TIER_THRESHOLD) return { input: 1.2, output: 8, cacheRead: 0.24 };
    return outputTokens < OUTPUT_TIER_THRESHOLD
      ? { input: 0.8, output: 2, cacheRead: 0.16 }
      : { input: 0.8, output: 6, cacheRead: 0.16 };
  }

  return null;
}

function quoteFromRates(rates, usage) {
  const cacheWriteTokens = Math.max(0, Number(usage?.cacheWriteTokens) || 0);
  const supportsCacheWrite = Number.isFinite(rates.cacheWrite);
  const partial = cacheWriteTokens > 0 && !supportsCacheWrite;
  const breakdown = {
    input: amountOf(usage?.inputTokens, rates.input),
    output: amountOf(usage?.outputTokens, rates.output),
    cacheRead: amountOf(usage?.cacheReadTokens, rates.cacheRead),
    cacheWrite: partial ? null : amountOf(usage?.cacheWriteTokens, rates.cacheWrite ?? 0)
  };
  return {
    status: partial ? "partial" : "priced",
    currency: "CNY",
    amount: breakdown.input + breakdown.output + breakdown.cacheRead + (breakdown.cacheWrite ?? 0),
    breakdown,
    unpricedTokens: partial ? cacheWriteTokens : 0,
    pricingBasis: partial ? "current-public-price-partial-context" : "current-public-price",
    source: SOURCE
  };
}

export function matches(config) {
  const id = trimString(config?.id)?.toLowerCase();
  if (id === "zhipu" || id === "bigmodel") return true;
  return hostOf(config?.baseURL) === OFFICIAL_HOST;
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "zhipu",
    displayName: trimString(config?.displayName) ?? (id === DEFAULT_ACCOUNT.id ? DEFAULT_ACCOUNT.displayName : id),
    baseURL: normalizeBaseURL(config?.baseURL),
    apiKeyEnv: trimString(config?.apiKeyEnv) ?? DEFAULT_ACCOUNT.apiKeyEnv
  };
}

export function resolvePrice({ model, usage }) {
  const normalized = normalizedModel(model);
  if (!normalized) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  const rates = FIXED_PRICE_BOOK[normalized] ?? tieredRates(normalized, usage);
  if (!rates) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  return quoteFromRates(rates, usage);
}

export default {
  id: "zhipu",
  capabilities: { balance: false, pricing: true },
  matches,
  normalizeConfig,
  resolvePrice
};
