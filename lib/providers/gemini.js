import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOST = "generativelanguage.googleapis.com";
const PRICING_URL = "https://ai.google.dev/gemini-api/docs/pricing";
const VERIFIED_AT = "2026-08-26";
const UNIT_TOKENS = 1_000_000;
const PRO_TIER_THRESHOLD = 200_000;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "gemini",
  displayName: "Gemini",
  baseURL: "https://generativelanguage.googleapis.com",
  apiKeyEnv: "GEMINI_API_KEY"
});

const SOURCE = Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT });

const PRICE_BOOK = Object.freeze({
  "gemini-2.5-pro": Object.freeze({
    tiers: Object.freeze({
      low: Object.freeze({ input: 1.25, output: 10, cacheRead: 0.125 }),
      high: Object.freeze({ input: 2.5, output: 15, cacheRead: 0.25 })
    })
  }),
  "gemini-2.5-flash": Object.freeze({ input: 0.3, output: 2.5, cacheRead: 0.03 }),
  "gemini-2.5-flash-lite": Object.freeze({ input: 0.1, output: 0.4, cacheRead: 0.01 })
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

function tierForPro(usage) {
  return Math.max(0, Number(usage?.inputTokens) || 0) > PRO_TIER_THRESHOLD
    ? PRICE_BOOK["gemini-2.5-pro"].tiers.high
    : PRICE_BOOK["gemini-2.5-pro"].tiers.low;
}

function quoteFromRates(rates, usage) {
  const cacheWriteTokens = Math.max(0, Number(usage?.cacheWriteTokens) || 0);
  const breakdown = {
    input: amountOf(usage?.inputTokens, rates.input),
    output: amountOf(usage?.outputTokens, rates.output),
    cacheRead: amountOf(usage?.cacheReadTokens, rates.cacheRead),
    cacheWrite: cacheWriteTokens > 0 ? null : 0
  };
  const amount = breakdown.input + breakdown.output + breakdown.cacheRead;
  if (cacheWriteTokens > 0) {
    return {
      status: "partial",
      currency: "USD",
      amount,
      breakdown,
      unpricedTokens: cacheWriteTokens,
      pricingBasis: "current-public-price-partial-context",
      source: SOURCE
    };
  }
  return {
    status: "priced",
    currency: "USD",
    amount,
    breakdown,
    unpricedTokens: 0,
    pricingBasis: "current-public-price",
    source: SOURCE
  };
}

export function matches(config) {
  const id = trimString(config?.id)?.toLowerCase();
  if (id === "gemini" || id === "google") return true;
  return hostOf(config?.baseURL) === OFFICIAL_HOST;
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "gemini",
    displayName: trimString(config?.displayName) ?? (id === DEFAULT_ACCOUNT.id ? DEFAULT_ACCOUNT.displayName : id),
    baseURL: normalizeBaseURL(config?.baseURL),
    apiKeyEnv: trimString(config?.apiKeyEnv) ?? DEFAULT_ACCOUNT.apiKeyEnv
  };
}

export function resolvePrice({ model, usage }) {
  const normalized = normalizedModel(model);
  if (!normalized) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  if (normalized === "gemini-2.5-pro") return quoteFromRates(tierForPro(usage), usage);
  const entry = PRICE_BOOK[normalized];
  if (!entry) return { status: "unknown", unpricedTokens: tokenCountOf(usage) };
  return quoteFromRates(entry, usage);
}

export default {
  id: "gemini",
  capabilities: { balance: false, pricing: true },
  matches,
  normalizeConfig,
  resolvePrice
};
