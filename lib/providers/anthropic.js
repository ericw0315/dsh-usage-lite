import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOST = "api.anthropic.com";
const PRICING_URL = "https://platform.claude.com/docs/en/about-claude/pricing";
const VERIFIED_AT = "2026-08-26";
const UNIT_TOKENS = 1_000_000;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "anthropic",
  displayName: "Anthropic",
  baseURL: "https://api.anthropic.com",
  apiKeyEnv: "ANTHROPIC_API_KEY"
});

const SOURCE = Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT });

const PRICE_BOOK = Object.freeze({
  "claude-fable-5": Object.freeze({ input: 10, output: 50, cacheRead: 1, cacheWrite5m: 12.5, cacheWrite1h: 20 }),
  "claude-opus-5": Object.freeze({ input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 }),
  "claude-opus-4.8": Object.freeze({ input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 }),
  "claude-opus-4.7": Object.freeze({ input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 }),
  "claude-opus-4.6": Object.freeze({ input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 }),
  "claude-opus-4.5": Object.freeze({ input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 }),
  "claude-sonnet-5": Object.freeze({ input: 2, output: 10, cacheRead: 0.2, cacheWrite5m: 2.5, cacheWrite1h: 4 }),
  "claude-sonnet-4.6": Object.freeze({ input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75, cacheWrite1h: 6 }),
  "claude-sonnet-4.5": Object.freeze({ input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75, cacheWrite1h: 6 }),
  "claude-sonnet-4": Object.freeze({ input: 3, output: 15, cacheRead: 0.3, cacheWrite5m: 3.75, cacheWrite1h: 6 }),
  "claude-haiku-4.5": Object.freeze({ input: 1, output: 5, cacheRead: 0.1, cacheWrite5m: 1.25, cacheWrite1h: 2 }),
  "claude-haiku-3.5": Object.freeze({ input: 0.8, output: 4, cacheRead: 0.08, cacheWrite5m: 1, cacheWrite1h: 1.6 })
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

function quoteFromEntry(entry, usage) {
  const hasCacheWrite = Math.max(0, Number(usage?.cacheWriteTokens) || 0) > 0;
  const breakdown = {
    input: amountOf(usage?.inputTokens, entry.input),
    output: amountOf(usage?.outputTokens, entry.output),
    cacheRead: amountOf(usage?.cacheReadTokens, entry.cacheRead),
    cacheWrite: amountOf(usage?.cacheWriteTokens, entry.cacheWrite5m)
  };
  return {
    status: "priced",
    currency: "USD",
    amount: breakdown.input + breakdown.output + breakdown.cacheRead + breakdown.cacheWrite,
    breakdown,
    unpricedTokens: 0,
    pricingBasis: hasCacheWrite ? "current-public-price-partial-context" : "current-public-price",
    source: SOURCE
  };
}

export function matches(config) {
  const id = trimString(config?.id)?.toLowerCase();
  if (id === "anthropic" || id === "claude") return true;
  return hostOf(config?.baseURL) === OFFICIAL_HOST;
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "anthropic",
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
  id: "anthropic",
  capabilities: { balance: false, pricing: true },
  matches,
  normalizeConfig,
  resolvePrice
};
