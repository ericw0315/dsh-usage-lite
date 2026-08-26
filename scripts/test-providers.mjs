import assert from "node:assert/strict";
import anthropic from "../lib/providers/anthropic.js";
import deepseek from "../lib/providers/deepseek.js";
import gemini from "../lib/providers/gemini.js";
import minimax from "../lib/providers/minimax.js";
import openai from "../lib/providers/openai.js";
import qwen from "../lib/providers/qwen.js";
import zhipu from "../lib/providers/zhipu.js";

const UNIT_TOKENS = 1_000_000;
const QWEN_SOURCE = {
  url: "https://help.aliyun.com/zh/model-studio/model-pricing",
  verifiedAt: "2026-08-26"
};
const ZHIPU_SOURCE = {
  url: "https://bigmodel.cn/pricing",
  verifiedAt: "2026-08-26"
};
const MINIMAX_SOURCE = {
  url: "https://platform.minimaxi.com/docs/guides/pricing-paygo",
  verifiedAt: "2026-08-26"
};

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

function quoted(tokens, rate) {
  return Number((((Math.max(0, Number(tokens) || 0)) / UNIT_TOKENS) * rate).toFixed(6));
}

function expectedQuote({
  status = "priced",
  currency = "CNY",
  usage,
  inputRate,
  outputRate,
  cacheReadRate = 0,
  cacheWriteRate = 0,
  cacheReadNull = false,
  cacheWriteNull = false,
  unpricedTokens = 0,
  pricingBasis = "current-public-price",
  source
}) {
  const breakdown = {
    input: quoted(usage?.inputTokens, inputRate),
    output: quoted(usage?.outputTokens, outputRate),
    cacheRead: cacheReadNull ? null : quoted(usage?.cacheReadTokens, cacheReadRate),
    cacheWrite: cacheWriteNull ? null : quoted(usage?.cacheWriteTokens, cacheWriteRate)
  };
  return {
    status,
    currency,
    amount: Number((
      breakdown.input +
      breakdown.output +
      (breakdown.cacheRead ?? 0) +
      (breakdown.cacheWrite ?? 0)
    ).toFixed(6)),
    breakdown,
    unpricedTokens,
    pricingBasis,
    source
  };
}

function assertUnknown(adapter, model, usage = millionUsage()) {
  assert.deepEqual(adapter.resolvePrice({ model, usage, occurredAt: weekdayAt(10) }), {
    status: "unknown",
    unpricedTokens: usage.inputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
  });
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

assertPricingOnly(qwen);
assert.equal(qwen.matches({ id: "qwen" }), true);
assert.equal(qwen.matches({ id: "dashscope" }), true);
assert.equal(qwen.matches({ id: "aliyun" }), true);
assert.equal(qwen.matches({ id: "qwen-main", baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1" }), true);
assert.equal(qwen.matches({ id: "custom-gateway", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(qwen.normalizeConfig({ id: "qwen-main" }), {
  id: "qwen-main",
  adapterId: "qwen",
  displayName: "qwen-main",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKeyEnv: "DASHSCOPE_API_KEY"
});

assert.deepEqual(qwen.resolvePrice({
  model: "qwen3.8-max",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }),
  inputRate: 12,
  outputRate: 36,
  source: QWEN_SOURCE
}));

for (const [inputTokens, inputRate] of [
  [255_999, 2],
  [256_000, 2],
  [256_001, 6]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen3.7-plus",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate: inputTokens <= 256_000 ? 8 : 24,
    source: QWEN_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate] of [
  [127_999, 0.8, 4.8],
  [128_000, 0.8, 4.8],
  [128_001, 2, 12],
  [255_999, 2, 12],
  [256_000, 2, 12],
  [256_001, 4, 24]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen3.5-plus",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    source: QWEN_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate] of [
  [127_999, 0.8, 2],
  [128_000, 0.8, 2],
  [128_001, 2.4, 20],
  [255_999, 2.4, 20],
  [256_000, 2.4, 20],
  [256_001, 4.8, 48]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen-plus",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    status: "partial",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    pricingBasis: "current-public-price-partial-context",
    source: QWEN_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate] of [
  [31_999, 0.2, 0.8],
  [32_000, 0.2, 0.8],
  [32_001, 0.6, 2.4],
  [255_999, 0.6, 2.4],
  [256_000, 0.6, 2.4],
  [256_001, 1.2, 4.8]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen3.7-flash",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    source: QWEN_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate] of [
  [127_999, 0.2, 2],
  [128_000, 0.2, 2],
  [128_001, 0.8, 8],
  [255_999, 0.8, 8],
  [256_000, 0.8, 8],
  [256_001, 1.2, 12]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen3.5-flash",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    source: QWEN_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate] of [
  [127_999, 0.15, 1.5],
  [128_000, 0.15, 1.5],
  [128_001, 0.6, 6],
  [255_999, 0.6, 6],
  [256_000, 0.6, 6],
  [256_001, 1.2, 12]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen-flash",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    source: QWEN_SOURCE
  }));
}

assert.deepEqual(qwen.resolvePrice({
  model: "qwen-turbo",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  status: "partial",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000 }),
  inputRate: 0.3,
  outputRate: 0.6,
  pricingBasis: "current-public-price-partial-context",
  source: QWEN_SOURCE
}));

for (const [inputTokens, inputRate, outputRate] of [
  [31_999, 4, 16],
  [32_000, 4, 16],
  [32_001, 6, 24],
  [127_999, 6, 24],
  [128_000, 6, 24],
  [128_001, 10, 40],
  [255_999, 10, 40],
  [256_000, 10, 40],
  [256_001, 20, 200]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen3-coder-plus",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    source: QWEN_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate] of [
  [31_999, 1, 4],
  [32_000, 1, 4],
  [32_001, 1.5, 6],
  [127_999, 1.5, 6],
  [128_000, 1.5, 6],
  [128_001, 2.5, 10],
  [255_999, 2.5, 10],
  [256_000, 2.5, 10],
  [256_001, 5, 25]
]) {
  assert.deepEqual(qwen.resolvePrice({
    model: "qwen3-coder-flash",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000 }),
    inputRate,
    outputRate,
    source: QWEN_SOURCE
  }));
}

assert.deepEqual(qwen.resolvePrice({
  model: "qwen3.8-max",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 25, cacheWriteTokens: 75 }),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  status: "partial",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 25, cacheWriteTokens: 75 }),
  inputRate: 12,
  outputRate: 36,
  cacheReadNull: true,
  cacheWriteNull: true,
  unpricedTokens: 100,
  pricingBasis: "current-public-price-partial-context",
  source: QWEN_SOURCE
}));

assert.deepEqual(qwen.resolvePrice({
  model: "qwen3.5-plus",
  usage: textUsage(),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: textUsage(),
  inputRate: 0.8,
  outputRate: 4.8,
  source: QWEN_SOURCE
}));
assertUnknown(qwen, "proxy/qwen-plus");

assertPricingOnly(zhipu);
assert.equal(zhipu.matches({ id: "zhipu" }), true);
assert.equal(zhipu.matches({ id: "bigmodel" }), true);
assert.equal(zhipu.matches({ id: "glm-main", baseURL: "https://open.bigmodel.cn/api/paas/v4" }), true);
assert.equal(zhipu.matches({ id: "custom-gateway", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(zhipu.normalizeConfig({ id: "glm-main" }), {
  id: "glm-main",
  adapterId: "zhipu",
  displayName: "glm-main",
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  apiKeyEnv: "ZHIPU_API_KEY"
});

for (const model of ["glm-5.3", "glm-5.2"]) {
  assert.deepEqual(zhipu.resolvePrice({
    model,
    usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    inputRate: 8,
    outputRate: 28,
    cacheReadRate: 2,
    source: ZHIPU_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate, cacheReadRate] of [
  [31_999, 6, 24, 1.3],
  [32_000, 8, 28, 2],
  [32_001, 8, 28, 2]
]) {
  assert.deepEqual(zhipu.resolvePrice({
    model: "glm-5.1",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    inputRate,
    outputRate,
    cacheReadRate,
    source: ZHIPU_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate, cacheReadRate] of [
  [31_999, 5, 22, 1.2],
  [32_000, 7, 26, 1.8],
  [32_001, 7, 26, 1.8]
]) {
  assert.deepEqual(zhipu.resolvePrice({
    model: "glm-5-turbo",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    inputRate,
    outputRate,
    cacheReadRate,
    source: ZHIPU_SOURCE
  }));
}

for (const [inputTokens, inputRate, outputRate, cacheReadRate] of [
  [31_999, 4, 18, 1],
  [32_000, 6, 22, 1.5],
  [32_001, 6, 22, 1.5]
]) {
  assert.deepEqual(zhipu.resolvePrice({
    model: "glm-5",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    inputRate,
    outputRate,
    cacheReadRate,
    source: ZHIPU_SOURCE
  }));
}

for (const [inputTokens, outputTokens, inputRate, outputRate, cacheReadRate] of [
  [31_999, 199, 2, 8, 0.4],
  [31_999, 200, 3, 14, 0.6],
  [32_000, 199, 4, 16, 0.8],
  [32_001, 200, 4, 16, 0.8]
]) {
  assert.deepEqual(zhipu.resolvePrice({
    model: "glm-4.7",
    usage: textUsage({ inputTokens, outputTokens, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens, cacheReadTokens: 1_000_000 }),
    inputRate,
    outputRate,
    cacheReadRate,
    source: ZHIPU_SOURCE
  }));
}

for (const [inputTokens, outputTokens, inputRate, outputRate, cacheReadRate] of [
  [31_999, 199, 0.8, 2, 0.16],
  [31_999, 200, 0.8, 6, 0.16],
  [32_000, 199, 1.2, 8, 0.24],
  [32_001, 200, 1.2, 8, 0.24]
]) {
  assert.deepEqual(zhipu.resolvePrice({
    model: "glm-4.5-air",
    usage: textUsage({ inputTokens, outputTokens, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens, cacheReadTokens: 1_000_000 }),
    inputRate,
    outputRate,
    cacheReadRate,
    source: ZHIPU_SOURCE
  }));
}

assert.deepEqual(zhipu.resolvePrice({
  model: "glm-4.7-flashx",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
  inputRate: 0.5,
  outputRate: 3,
  cacheReadRate: 0.1,
  source: ZHIPU_SOURCE
}));

assert.deepEqual(zhipu.resolvePrice({
  model: "glm-4.7-flash",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: millionUsage(),
  inputRate: 0,
  outputRate: 0,
  cacheReadRate: 0,
  cacheWriteRate: 0,
  source: ZHIPU_SOURCE
}));

assert.deepEqual(zhipu.resolvePrice({
  model: "glm-5.3",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheWriteTokens: 17 }),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  status: "partial",
  usage: textUsage({ inputTokens: 1_000_000, outputTokens: 1_000_000, cacheWriteTokens: 17 }),
  inputRate: 8,
  outputRate: 28,
  cacheWriteNull: true,
  unpricedTokens: 17,
  pricingBasis: "current-public-price-partial-context",
  source: ZHIPU_SOURCE
}));

assert.deepEqual(zhipu.resolvePrice({
  model: "glm-4.7-flashx",
  usage: textUsage(),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: textUsage(),
  inputRate: 0.5,
  outputRate: 3,
  cacheReadRate: 0.1,
  source: ZHIPU_SOURCE
}));
assertUnknown(zhipu, "proxy/glm-5.3");

assertPricingOnly(minimax);
assert.equal(minimax.matches({ id: "minimax" }), true);
assert.equal(minimax.matches({ id: "minimax-main", baseURL: "https://api.minimaxi.com/v1" }), true);
assert.equal(minimax.matches({ id: "minimax-io", baseURL: "https://api.minimax.io/v1" }), true);
assert.equal(minimax.matches({ id: "custom-gateway", baseURL: "https://gateway.example/v1" }), false);
assert.deepEqual(minimax.normalizeConfig({ id: "minimax-main" }), {
  id: "minimax-main",
  adapterId: "minimax",
  displayName: "minimax-main",
  baseURL: "https://api.minimaxi.com/v1",
  apiKeyEnv: "MINIMAX_API_KEY"
});

for (const [inputTokens, inputRate, outputRate, cacheReadRate] of [
  [511_999, 2.1, 8.4, 0.42],
  [512_000, 2.1, 8.4, 0.42],
  [512_001, 4.2, 16.8, 0.84]
]) {
  assert.deepEqual(minimax.resolvePrice({
    model: "MiniMax-M3",
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    occurredAt: weekdayAt(10)
  }), expectedQuote({
    usage: textUsage({ inputTokens, outputTokens: 1_000_000, cacheReadTokens: 1_000_000 }),
    inputRate,
    outputRate,
    cacheReadRate,
    source: MINIMAX_SOURCE
  }));
}

assert.deepEqual(minimax.resolvePrice({
  model: "MiniMax-M3",
  usage: textUsage({ inputTokens: 512_000, outputTokens: 1_000_000, cacheWriteTokens: 33 }),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  status: "partial",
  usage: textUsage({ inputTokens: 512_000, outputTokens: 1_000_000, cacheWriteTokens: 33 }),
  inputRate: 2.1,
  outputRate: 8.4,
  cacheWriteNull: true,
  unpricedTokens: 33,
  pricingBasis: "current-public-price-partial-context",
  source: MINIMAX_SOURCE
}));

assert.deepEqual(minimax.resolvePrice({
  model: "MiniMax-M2.7",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: millionUsage(),
  inputRate: 2.1,
  outputRate: 8.4,
  cacheReadRate: 0.42,
  cacheWriteRate: 2.625,
  source: MINIMAX_SOURCE
}));

assert.deepEqual(minimax.resolvePrice({
  model: "MiniMax-M2.7-highspeed",
  usage: millionUsage(),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: millionUsage(),
  inputRate: 4.2,
  outputRate: 16.8,
  cacheReadRate: 0.42,
  cacheWriteRate: 2.625,
  source: MINIMAX_SOURCE
}));

assert.deepEqual(minimax.resolvePrice({
  model: "MiniMax-M2.7",
  usage: textUsage(),
  occurredAt: weekdayAt(10)
}), expectedQuote({
  usage: textUsage(),
  inputRate: 2.1,
  outputRate: 8.4,
  cacheReadRate: 0.42,
  cacheWriteRate: 2.625,
  source: MINIMAX_SOURCE
}));
assertUnknown(minimax, "proxy/MiniMax-M3");

console.log("providers ok");
