import { tokenCountOf } from "../provider-runtime.js";

const OFFICIAL_HOST = "api.deepseek.com";
const VERIFIED_AT = "2026-08-26";
const PRICING_URL = "https://api-docs.deepseek.com/quick_start/pricing/";
const UNIT_TOKENS = 1_000_000;

export const DEFAULT_ACCOUNT = Object.freeze({
  id: "deepseek-official",
  displayName: "DeepSeek",
  baseURL: "https://api.deepseek.com",
  apiKeyEnv: "DEEPSEEK_API_KEY"
});

export const LEGACY_PRICE_BOOK = Object.freeze({
  "deepseek-chat": Object.freeze({
    currency: "CNY",
    input: 2,
    output: 8,
    cacheRead: 0.5,
    cacheWrite: 2,
    pricingBasis: "legacy-project-price"
  }),
  "deepseek-reasoner": Object.freeze({
    currency: "CNY",
    input: 4,
    output: 16,
    cacheRead: 1,
    cacheWrite: 4,
    pricingBasis: "legacy-project-price"
  })
});

const CURRENT_PRICE_BOOK = Object.freeze({
  "deepseek-v4-flash": Object.freeze({
    currency: "USD",
    input: 0.14,
    output: 0.28,
    cacheRead: 0.0028,
    cacheWrite: 0.14,
    pricingBasis: "current-public-price",
    source: Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT })
  }),
  "deepseek-v4-pro": Object.freeze({
    currency: "USD",
    input: 0.435,
    output: 0.87,
    cacheRead: 0.003625,
    cacheWrite: 0.435,
    pricingBasis: "current-public-price",
    source: Object.freeze({ url: PRICING_URL, verifiedAt: VERIFIED_AT })
  })
});

function notConfigured() {
  return Object.assign(new Error("not-configured"), { code: "not-configured" });
}

function invalidResponse() {
  return Object.assign(new Error("invalid-response"), { code: "invalid-response" });
}

function upstreamError() {
  return Object.assign(new Error("upstream-error"), { code: "upstream-error" });
}

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

function joinURL(baseURL, path) {
  return `${normalizeBaseURL(baseURL)}${path.startsWith("/") ? path : `/${path}`}`;
}

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function parseBalanceInfo(info) {
  if (info === null || typeof info !== "object" || Array.isArray(info)) throw invalidResponse();
  const remaining = Number(info.total_balance);
  const granted = Number(info.granted_balance);
  const toppedUp = Number(info.topped_up_balance);
  if (!isFiniteNumber(remaining) || !isFiniteNumber(granted) || !isFiniteNumber(toppedUp)) throw invalidResponse();
  return {
    remaining,
    granted,
    toppedUp,
    currency: trimString(info.currency) ?? "CNY"
  };
}

function currentModelOf(model) {
  const value = trimString(model);
  if (!value) return null;
  if (value === "deepseek-v4-pro" || value === "deepseek-v4-flash") return value;
  return null;
}

function legacyModelOf(model) {
  const value = trimString(model);
  if (!value) return null;
  if (value === "deepseek-chat" || value === "deepseek-reasoner") return value;
  return null;
}

function isPeakHour(occurredAt) {
  if (!Number.isFinite(occurredAt)) return false;
  const hour = new Date(occurredAt).getUTCHours();
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
}

function amountOf(tokens, rate, multiplier = 1) {
  return ((Math.max(0, Number(tokens) || 0) / UNIT_TOKENS) * rate) * multiplier;
}

function quoteFromEntry(entry, usage, multiplier = 1) {
  const breakdown = {
    input: amountOf(usage?.inputTokens, entry.input, multiplier),
    output: amountOf(usage?.outputTokens, entry.output, multiplier),
    cacheRead: amountOf(usage?.cacheReadTokens, entry.cacheRead, multiplier),
    cacheWrite: amountOf(usage?.cacheWriteTokens, entry.cacheWrite, multiplier)
  };
  return {
    status: "priced",
    currency: entry.currency,
    amount: breakdown.input + breakdown.output + breakdown.cacheRead + breakdown.cacheWrite,
    breakdown,
    unpricedTokens: 0,
    pricingBasis: entry.pricingBasis,
    source: entry.source ?? void 0
  };
}

export function matches(config) {
  const id = trimString(config?.id)?.toLowerCase();
  if (id === "deepseek" || id === DEFAULT_ACCOUNT.id) return true;
  return hostOf(config?.baseURL) === OFFICIAL_HOST;
}

export function normalizeConfig(config = {}) {
  const id = trimString(config?.id) ?? DEFAULT_ACCOUNT.id;
  return {
    id,
    adapterId: "deepseek",
    displayName: trimString(config?.displayName) ?? (id === DEFAULT_ACCOUNT.id ? DEFAULT_ACCOUNT.displayName : id),
    baseURL: normalizeBaseURL(config?.baseURL),
    apiKeyEnv: trimString(config?.apiKeyEnv) ?? DEFAULT_ACCOUNT.apiKeyEnv
  };
}

export async function fetchBalance({ config, resolveCredential, fetch, now }) {
  const credential = await resolveCredential(config?.apiKeyEnv);
  const apiKey = typeof credential === "string" ? credential : credential?.value;
  if (!trimString(apiKey)) throw notConfigured();

  const response = await fetch(joinURL(config?.baseURL, "/user/balance"), {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    }
  });
  if (!response?.ok) throw upstreamError();

  const payload = await response.json();
  const info = Array.isArray(payload?.balance_infos) ? payload.balance_infos[0] : null;
  return {
    status: "available",
    fetchedAt: now(),
    balance: parseBalanceInfo(info)
  };
}

export function resolvePrice({ model, usage, occurredAt }) {
  const currentModel = currentModelOf(model);
  if (currentModel) {
    const multiplier = isPeakHour(occurredAt) ? 2 : 1;
    return quoteFromEntry(CURRENT_PRICE_BOOK[currentModel], usage, multiplier);
  }

  const legacyModel = legacyModelOf(model);
  if (legacyModel) return quoteFromEntry(LEGACY_PRICE_BOOK[legacyModel], usage);

  return {
    status: "unknown",
    unpricedTokens: tokenCountOf(usage)
  };
}

export default {
  id: "deepseek",
  capabilities: { balance: true, pricing: true },
  matches,
  normalizeConfig,
  fetchBalance,
  resolvePrice
};
