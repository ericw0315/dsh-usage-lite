import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOSTS = new Set(["api.minimaxi.com", "api.minimax.io"]);
const PRICING_URL = "https://platform.minimaxi.com/docs/guides/pricing-paygo";
const VERIFIED_AT = "2026-08-26";
const UNIT_TOKENS = 1_000_000;
const M3_TIER_THRESHOLD = 512_000;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "minimax",
  displayName: "MiniMax",
  baseURL: "https://api.minimaxi.com/v1",
  apiKeyEnv: "MINIMAX_API_KEY"
});

const SOURCE = Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT });

const PRICE_BOOK = Object.freeze({
  "minimax-m3": Object.freeze({
    tiers: Object.freeze([
      Object.freeze({ maxInputTokens: M3_TIER_THRESHOLD, input: 2.1, output: 8.4, cacheRead: 0.42 }),
      Object.freeze({ maxInputTokens: Number.POSITIVE_INFINITY, input: 4.2, output: 16.8, cacheRead: 0.84 })
    ])
  }),
  "minimax-m2.7": Object.freeze({ input: 2.1, output: 8.4, cacheRead: 0.42, cacheWrite: 2.625 }),
  "minimax-m2.7-highspeed": Object.freeze({ input: 4.2, output: 16.8, cacheRead: 0.42, cacheWrite: 2.625 })
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

function ratesFor(entry, usage) {
  if (!Array.isArray(entry?.tiers)) return entry;
  const inputTokens = Math.max(0, Number(usage?.inputTokens) || 0);
  return entry.tiers.find((tier) => inputTokens <= tier.maxInputTokens) ?? null;
}

function quoteFromRates(rates, usage) {
  const cacheWriteTokens = Math.max(0, Number(usage?.cacheWriteTokens) || 0);
  const supportsCacheWrite = Number.isFinite(rates.cacheWrite);
  const partial = cacheWriteTokens > 0 && !supportsCacheWrite;
  const breakdown = {
    input: amountOf(usage?.inputTokens, rates.input),
    output: amountOf(usage?.outputTokens, rates.output),
    cacheRead: amountOf(usage?.cacheReadTokens, rates.cacheRead ?? 0),
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
  if (id === "minimax") return true;
  return OFFICIAL_HOSTS.has(hostOf(config?.baseURL));
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "minimax",
    displayName: trimString(config?.displayName) ?? (id === DEFAULT_ACCOUNT.id ? DEFAULT_ACCOUNT.displayName : id),
    baseURL: normalizeBaseURL(config?.baseURL),
    apiKeyEnv: trimString(config?.apiKeyEnv) ?? DEFAULT_ACCOUNT.apiKeyEnv
  };
}

export function resolvePrice({ model, usage }) {
  const entry = PRICE_BOOK[normalizedModel(model)];
  if (!entry) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  const rates = ratesFor(entry, usage);
  if (!rates) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  return quoteFromRates(rates, usage);
}

export default {
  id: "minimax",
  capabilities: { balance: false, pricing: true },
  matches,
  normalizeConfig,
  resolvePrice
};
