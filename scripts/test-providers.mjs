import assert from "node:assert/strict";
import anthropic from "../lib/providers/anthropic.js";
import deepseek from "../lib/providers/deepseek.js";
import gemini from "../lib/providers/gemini.js";
import openai from "../lib/providers/openai.js";

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

function textUsage({
  inputTokens = 0,
  outputTokens = 0,
  cacheReadTokens = 0,
  cacheWriteTokens = 0
} = {}) {
  return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens };
}

function assertPricingOnly(adapter) {
  assert.deepEqual(adapter.capabilities, { balance: false, pricing: true });
  assert.equal("fetchBalance" in adapter, false);
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

assertPricingOnly(openai);
assert.equal(openai.matches({ id: "openai" }), true);
assert.equal(openai.matches({ id: "openai-main", baseURL: "https://api.openai.com/v1" }), true);
assert.equal(openai.matches({ id: "custom-gateway", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(openai.normalizeConfig({ id: "openai-main" }), {
  id: "openai-main",
  adapterId: "openai",
  displayName: "openai-main",
  baseURL: "https://api.openai.com/v1",
  apiKeyEnv: "OPENAI_API_KEY"
});

const openaiLuna = openai.resolvePrice({
  model: "GPT-5.6-LUNA",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
});
assert.deepEqual(openaiLuna, {
  status: "priced",
  currency: "USD",
  amount: 1.67,
  breakdown: {
    input: 0.2,
    output: 1.2,
    cacheRead: 0.02,
    cacheWrite: 0.25
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price-partial-context",
  source: {
    url: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(openai.resolvePrice({
  model: "gpt-5.6-terra",
  usage: textUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 0,
  breakdown: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price-partial-context",
  source: {
    url: "https://developers.openai.com/api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(openai.resolvePrice({
  model: "private-model",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});
assert.deepEqual(openai.resolvePrice({
  model: "proxy/foo/gpt-5.6-luna",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});

assertPricingOnly(anthropic);
assert.equal(anthropic.matches({ id: "anthropic" }), true);
assert.equal(anthropic.matches({ id: "claude" }), true);
assert.equal(anthropic.matches({ id: "anthropic-main", baseURL: "https://api.anthropic.com/v1/messages" }), true);
assert.equal(anthropic.matches({ id: "custom-gateway", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(anthropic.normalizeConfig({ id: "anthropic-main" }), {
  id: "anthropic-main",
  adapterId: "anthropic",
  displayName: "anthropic-main",
  baseURL: "https://api.anthropic.com",
  apiKeyEnv: "ANTHROPIC_API_KEY"
});

assert.deepEqual(anthropic.resolvePrice({
  model: "claude-sonnet-5",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 12,
  breakdown: {
    input: 2,
    output: 10,
    cacheRead: 0,
    cacheWrite: 0
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(anthropic.resolvePrice({
  model: "claude-opus-4.7",
  usage: textUsage({
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
    cacheReadTokens: 1_000_000,
    cacheWriteTokens: 1_000_000
  }),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 36.75,
  breakdown: {
    input: 5,
    output: 25,
    cacheRead: 0.5,
    cacheWrite: 6.25
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price-partial-context",
  source: {
    url: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(anthropic.resolvePrice({
  model: "claude-haiku-4.5",
  usage: textUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 0,
  breakdown: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(anthropic.resolvePrice({
  model: "claude-private",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});
assert.deepEqual(anthropic.resolvePrice({
  model: "custom/claude-sonnet-5",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});

assertPricingOnly(gemini);
assert.equal(gemini.matches({ id: "gemini" }), true);
assert.equal(gemini.matches({ id: "google" }), true);
assert.equal(gemini.matches({ id: "gemini-main", baseURL: "https://generativelanguage.googleapis.com/v1beta/models" }), true);
assert.equal(gemini.matches({ id: "custom-gateway", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(gemini.normalizeConfig({ id: "gemini-main" }), {
  id: "gemini-main",
  adapterId: "gemini",
  displayName: "gemini-main",
  baseURL: "https://generativelanguage.googleapis.com",
  apiKeyEnv: "GEMINI_API_KEY"
});

assert.deepEqual(gemini.resolvePrice({
  model: "gemini-2.5-pro",
  usage: textUsage({
    inputTokens: 200_000,
    outputTokens: 1_000_000,
    cacheReadTokens: 1_000_000
  }),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 10.375,
  breakdown: {
    input: 0.25,
    output: 10,
    cacheRead: 0.125,
    cacheWrite: 0
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(gemini.resolvePrice({
  model: "gemini-2.5-pro",
  usage: textUsage({
    inputTokens: 200_001,
    outputTokens: 1_000_000,
    cacheReadTokens: 1_000_000
  }),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 15.750003,
  breakdown: {
    input: 0.500003,
    output: 15,
    cacheRead: 0.25,
    cacheWrite: 0
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(gemini.resolvePrice({
  model: "gemini-2.5-flash",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "partial",
  currency: "USD",
  amount: 2.83,
  breakdown: {
    input: 0.3,
    output: 2.5,
    cacheRead: 0.03,
    cacheWrite: null
  },
  unpricedTokens: 1_000_000,
  pricingBasis: "current-public-price-partial-context",
  source: {
    url: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(gemini.resolvePrice({
  model: "gemini-2.5-flash-lite",
  usage: textUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "priced",
  currency: "USD",
  amount: 0,
  breakdown: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0
  },
  unpricedTokens: 0,
  pricingBasis: "current-public-price",
  source: {
    url: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-26"
  }
});
assert.deepEqual(gemini.resolvePrice({
  model: "private-model",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});
assert.deepEqual(gemini.resolvePrice({
  model: "proxy/gemini-2.5-flash",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), {
  status: "unknown",
  unpricedTokens: 4_000_000
});

console.log("providers ok");
