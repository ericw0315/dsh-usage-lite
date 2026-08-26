import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOSTS = new Set(["dashscope.aliyuncs.com", "dashscope-intl.aliyuncs.com"]);
const PRICING_URL = "https://help.aliyun.com/zh/model-studio/model-pricing";
const VERIFIED_AT = "2026-08-26";
const UNIT_TOKENS = 1_000_000;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "qwen",
  displayName: "Qwen",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKeyEnv: "DASHSCOPE_API_KEY"
});

const SOURCE = Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT });

const PRICE_BOOK = Object.freeze({
  "qwen3.8-max": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 1_000_000, input: 12, output: 36 })
    ])
  }),
  "qwen3.7-plus": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 256_000, input: 2, output: 8 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 6, output: 24 })
    ])
  }),
  "qwen3.5-plus": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 128_000, input: 0.8, output: 4.8 }),
      Object.freeze({ maxInputTokens: 256_000, input: 2, output: 12 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 4, output: 24 })
    ])
  }),
  "qwen-plus": Object.freeze({
    maxInputTokens: 1_000_000,
    modePartial: true,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 128_000, input: 0.8, output: 2 }),
      Object.freeze({ maxInputTokens: 256_000, input: 2.4, output: 20 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 4.8, output: 48 })
    ])
  }),
  "qwen3.7-flash": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 32_000, input: 0.2, output: 0.8 }),
      Object.freeze({ maxInputTokens: 256_000, input: 0.6, output: 2.4 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 1.2, output: 4.8 })
    ])
  }),
  "qwen3.5-flash": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 128_000, input: 0.2, output: 2 }),
      Object.freeze({ maxInputTokens: 256_000, input: 0.8, output: 8 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 1.2, output: 12 })
    ])
  }),
  "qwen-flash": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 128_000, input: 0.15, output: 1.5 }),
      Object.freeze({ maxInputTokens: 256_000, input: 0.6, output: 6 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 1.2, output: 12 })
    ])
  }),
  "qwen-turbo": Object.freeze({
    maxInputTokens: 1_000_000,
    modePartial: true,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 1_000_000, input: 0.3, output: 0.6 })
    ])
  }),
  "qwen3-coder-plus": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 32_000, input: 4, output: 16 }),
      Object.freeze({ maxInputTokens: 128_000, input: 6, output: 24 }),
      Object.freeze({ maxInputTokens: 256_000, input: 10, output: 40 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 20, output: 200 })
    ])
  }),
  "qwen3-coder-flash": Object.freeze({
    maxInputTokens: 1_000_000,
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: 32_000, input: 1, output: 4 }),
      Object.freeze({ maxInputTokens: 128_000, input: 1.5, output: 6 }),
      Object.freeze({ maxInputTokens: 256_000, input: 2.5, output: 10 }),
      Object.freeze({ maxInputTokens: 1_000_000, input: 5, output: 25 })
    ])
  })
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

function tierFor(entry, usage) {
  const inputTokens = Math.max(0, Number(usage?.inputTokens) || 0);
  if (inputTokens > entry.maxInputTokens) return null;
  return entry.tiers.find((tier) => inputTokens <= tier.maxInputTokens) ?? null;
}

function quoteFromEntry(entry, usage) {
  const tier = tierFor(entry, usage);
  if (!tier) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };

  const cacheReadTokens = Math.max(0, Number(usage?.cacheReadTokens) || 0);
  const cacheWriteTokens = Math.max(0, Number(usage?.cacheWriteTokens) || 0);
  const unknownCache = cacheReadTokens + cacheWriteTokens;
  const partial = entry.modePartial || unknownCache > 0;
  const breakdown = {
    input: amountOf(usage?.inputTokens, tier.input),
    output: amountOf(usage?.outputTokens, tier.output),
    cacheRead: cacheReadTokens > 0 ? null : 0,
    cacheWrite: cacheWriteTokens > 0 ? null : 0
  };
  return {
    status: partial ? "partial" : "priced",
    currency: "CNY",
    amount: breakdown.input + breakdown.output,
    breakdown,
    unpricedTokens: unknownCache,
    pricingBasis: partial ? "current-public-price-partial-context" : "current-public-price",
    source: SOURCE
  };
}

export function matches(config) {
  const id = trimString(config?.id)?.toLowerCase();
  if (id === "qwen" || id === "dashscope" || id === "aliyun") return true;
  return OFFICIAL_HOSTS.has(hostOf(config?.baseURL));
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "qwen",
    displayName: trimString(config?.displayName) ?? (id === DEFAULT_ACCOUNT.id ? DEFAULT_ACCOUNT.displayName : id),
    baseURL: normalizeBaseURL(config?.baseURL),
    apiKeyEnv: trimString(config?.apiKeyEnv) ?? DEFAULT_ACCOUNT.apiKeyEnv
  };
}

export function resolvePrice({ model, usage }) {
  const entry = PRICE_BOOK[normalizedModel(model)];
  if (!entry) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  return quoteFromEntry(entry, usage);
}

export default {
  id: "qwen",
  capabilities: { balance: false, pricing: true },
  matches,
  normalizeConfig,
  resolvePrice
};
