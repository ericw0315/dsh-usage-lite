import assert from "node:assert/strict";
import deepseek from "../lib/providers/deepseek.js";

function weekdayAt(hour) {
  return Date.UTC(2026, 7, 26, hour, 0, 0);
}

function millionUsage() {
  return {
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    cacheReadTokens: 1_000_000,
    cacheWriteTokens: 1_000_000
  };
}

assert.equal(deepseek.matches({ id: "deepseek-official" }), true);
assert.equal(deepseek.matches({ id: "custom", baseURL: "https://api.deepseek.com/v1" }), true);
assert.equal(deepseek.matches({ id: "custom", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(deepseek.normalizeConfig({ id: "deepseek-official" }), {
  id: "deepseek-official",
  adapterId: "deepseek",
  displayName: "DeepSeek",
  baseURL: "https://api.deepseek.com",
  apiKeyEnv: "DEEPSEEK_API_KEY"
});

const balance = await deepseek.fetchBalance({
  config: deepseek.normalizeConfig({ id: "deepseek-official" }),
  resolveCredential: async () => ({ value: "sk-test" }),
  fetch: async (url, init) => {
    assert.equal(url, "https://api.deepseek.com/user/balance");
    assert.equal(init?.headers?.authorization, "Bearer sk-test");
    return {
      ok: true,
      json: async () => ({
        balance_infos: [{
          total_balance: "12.5",
          granted_balance: "2.5",
          topped_up_balance: "10",
          currency: "CNY"
        }]
      })
    };
  },
  now: () => 123
});
assert.equal(balance.balance.remaining, 12.5);
assert.equal(balance.balance.granted, 2.5);
assert.equal(balance.balance.toppedUp, 10);
assert.equal(balance.fetchedAt, 123);

await assert.rejects(() => deepseek.fetchBalance({
  config: deepseek.normalizeConfig({ id: "deepseek-official" }),
  resolveCredential: async () => null,
  fetch: async () => {
    throw new Error("fetch should not run without credentials");
  },
  now: () => 456
}), (error) => {
  assert.equal(error.code, "not-configured");
  return true;
});

await assert.rejects(() => deepseek.fetchBalance({
  config: deepseek.normalizeConfig({ id: "deepseek-official", baseURL: "https://api.deepseek.com/v1/" }),
  resolveCredential: async () => ({ value: "sk-test" }),
  fetch: async (url) => {
    assert.equal(url, "https://api.deepseek.com/v1/user/balance");
    return {
      ok: true,
      json: async () => ({ balance_infos: [{}] })
    };
  },
  now: () => 789
}), (error) => {
  assert.equal(error.code, "invalid-response");
  return true;
});

await assert.rejects(() => deepseek.fetchBalance({
  config: deepseek.normalizeConfig({ id: "deepseek-official" }),
  resolveCredential: async () => ({ value: "sk-test" }),
  fetch: async () => ({ ok: false, status: 429, json: async () => ({}) }),
  now: () => 321
}), (error) => {
  assert.equal(error.code, "upstream-error");
  assert.equal(String(error).includes("429"), false);
  return true;
});

const flashPeak = deepseek.resolvePrice({
  model: "deepseek-v4-flash",
  usage: millionUsage(),
  occurredAt: weekdayAt(1)
});
assert.deepEqual(flashPeak, {
  status: "priced",
  currency: "USD",
  amount: 1.1256,
  breakdown: {
    input: 0.28,
    output: 0.56,
    cacheRead: 0.0056,
    cacheWrite: 0.28
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://api-docs.deepseek.com/quick_start/pricing/",
    verifiedAt: "2026-08-26"
  }
});

const flashOffPeak = deepseek.resolvePrice({
  model: "deepseek-v4-flash",
  usage: millionUsage(),
  occurredAt: weekdayAt(4)
});
assert.equal(flashOffPeak.amount, 0.5628);
assert.deepEqual(flashOffPeak.breakdown, {
  input: 0.14,
  output: 0.28,
  cacheRead: 0.0028,
  cacheWrite: 0.14
});

const proPeak = deepseek.resolvePrice({
  model: "deepseek-v4-pro",
  usage: millionUsage(),
  occurredAt: weekdayAt(6)
});
assert.equal(proPeak.amount, 3.48725);
assert.deepEqual(proPeak.breakdown, {
  input: 0.87,
  output: 1.74,
  cacheRead: 0.00725,
  cacheWrite: 0.87
});

const proOffPeak = deepseek.resolvePrice({
  model: "deepseek-v4-pro",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
});
assert.equal(proOffPeak.amount, 1.743625);
assert.deepEqual(proOffPeak.breakdown, {
  input: 0.435,
  output: 0.87,
  cacheRead: 0.003625,
  cacheWrite: 0.435
});

const legacyChat = deepseek.resolvePrice({
  model: "deepseek-chat",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
});
assert.equal(legacyChat.currency, "CNY");
assert.equal(legacyChat.pricingBasis, "legacy-project-price");
assert.equal(legacyChat.amount, 12.5);

const legacyReasoner = deepseek.resolvePrice({
  model: "deepseek-reasoner",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
});
assert.equal(legacyReasoner.currency, "CNY");
assert.equal(legacyReasoner.pricingBasis, "legacy-project-price");
assert.equal(legacyReasoner.amount, 25);

assert.deepEqual(deepseek.resolvePrice({
  model: "deepseek-v4-private",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});

console.log("providers ok");
