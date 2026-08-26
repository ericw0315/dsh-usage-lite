import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOST = "api.openai.com";
const PRICING_URL = "https://developers.openai.com/api/docs/pricing";
const VERIFIED_AT = "2026-08-26";
const UNIT_TOKENS = 1_000_000;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "openai",
  displayName: "OpenAI",
  baseURL: "https://api.openai.com/v1",
  apiKeyEnv: "OPENAI_API_KEY"
});

const PRICE_BOOK = Object.freeze({
  "gpt-5.6-sol": Object.freeze({ input: 4, output: 20, cacheRead: 0.4, cacheWrite: 5 }),
  "gpt-5.6-terra": Object.freeze({ input: 2, output: 12, cacheRead: 0.2, cacheWrite: 2.5 }),
  "gpt-5.6-luna": Object.freeze({ input: 0.2, output: 1.2, cacheRead: 0.02, cacheWrite: 0.25 })
});

const SOURCE = Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT });

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

function quoteFromEntry(entry, usage) {
  const breakdown = {
    input: amountOf(usage?.inputTokens, entry.input),
    output: amountOf(usage?.outputTokens, entry.output),
    cacheRead: amountOf(usage?.cacheReadTokens, entry.cacheRead),
    cacheWrite: amountOf(usage?.cacheWriteTokens, entry.cacheWrite)
  };
  return {
    status: "priced",
    currency: "USD",
    amount: breakdown.input + breakdown.output + breakdown.cacheRead + breakdown.cacheWrite,
    breakdown,
    unpricedTokens: 0,
    pricingBasis: "current-public-price-partial-context",
    source: SOURCE
  };
}

export function matches(config) {
  const id = trimString(config?.id)?.toLowerCase();
  if (id === "openai") return true;
  return hostOf(config?.baseURL) === OFFICIAL_HOST;
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "openai",
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
  id: "openai",
  capabilities: { balance: false, pricing: true },
  matches,
  normalizeConfig,
  resolvePrice
};
