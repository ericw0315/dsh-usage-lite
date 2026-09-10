import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

function usageEvent({ seq, time, provider, model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0 }) {
  return {
    seq,
    time,
    type: "assistant/message",
    data: {
      turn: `turn-${seq}`,
      step: 0,
      usage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens },
      message: { source: { provider, model } }
    }
  };
}

/** compaction/summary carries attribution flat on data, not under data.message.source. */
function compactionEvent({ seq, time, provider, model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0 }) {
  return {
    seq,
    time,
    type: "compaction/summary",
    data: {
      compactionId: `compaction-${seq}`,
      llmStreamCall: true,
      model,
      provider,
      usage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens },
      summary: [{ type: "text", text: "…" }]
    }
  };
}

async function testExplicitProviderAggregation() {
  const plugin = await freshModule("explicit-provider");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "live-provider",
        snapshotEvents: () => [usageEvent({
          seq: 1,
          time: at,
          provider: "deepseek-official",
          model: "deepseek-v4-pro",
          inputTokens: 1000,
          outputTokens: 100
        })]
      }]
    },
    persistence: { list: async () => [] }
  }));

  assert.deepEqual(billing.providers.map((provider) => provider.id), ["deepseek-official"]);
  assert.deepEqual(billing.providers[0].models.map((model) => model.id), ["deepseek-v4-pro"]);
}

async function freshModule(label) {
  return import(new URL(`../lib/index.js?test=${label}-${Date.now()}-${Math.random()}`, import.meta.url));
}

function makeResponse() {
  return {
    status: null,
    body: "",
    writeHead(status) { this.status = status; },
    end(body = "") { this.body = body; }
  };
}

function makeContext({ sessions, persistence, routes, fetchImpl, settings } = {}) {
  if (fetchImpl) globalThis.fetch = fetchImpl;
  const base = {
    logger: { warn: () => {} },
    credentials: { resolve: async () => ({ value: "sk-test" }) },
    webServer: {
      register: (entry) => {
        routes?.set(entry.path, entry.handler);
        return () => {};
      }
    },
    effect: (register) => register(),
    get: (name) => {
      if (name === "sessions") return sessions;
      if (name === "sessionPersistence") return persistence;
      if (name === "settings") return settings;
      throw new Error(`cannot get property "${name}" without inject`);
    }
  };
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop === "dshUsageLiteFetch") throw new Error('cannot get property "dshUsageLiteFetch" without inject');
      return Reflect.get(target, prop, receiver);
    }
  });
}

async function testConfiguredProviderAccounts() {
  const plugin = await freshModule("configured-providers");
  const routes = new Map();
  let balanceRequests = 0;
  const settings = {
    get: (name) => {
      if (name === "llm-deepseek") return { apiKeyEnv: "DEEPSEEK_API_KEY", baseURL: "https://api.deepseek.com" };
      if (name === "llm-pi-ai") return {
        providers: {
          "openai-main": { displayName: "OpenAI Main", apiKeyEnv: "OPENAI_API_KEY", baseURL: "https://api.openai.com/v1" },
          "custom-gateway": { displayName: "Custom Gateway", baseURL: "https://gateway.example/v1" }
        }
      };
      return void 0;
    }
  };
  await plugin.apply(makeContext({
    sessions: { list: () => [] },
    persistence: { list: async () => [] },
    routes,
    settings,
    fetchImpl: async () => {
      balanceRequests += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ balance_infos: [{ total_balance: "12.50", granted_balance: "2.50", topped_up_balance: "10.00", currency: "CNY" }] })
      };
    }
  }));

  const detail = makeResponse();
  await routes.get(plugin.DETAIL_PATH)({
    method: "GET",
    url: plugin.DETAIL_PATH,
    headers: { host: "localhost:3080" },
    socket: { remoteAddress: "127.0.0.1" }
  }, detail);
  const body = JSON.parse(detail.body);
  assert.deepEqual(body.providers.map((provider) => provider.id), ["deepseek-official", "custom-gateway", "openai-main"]);
  assert.equal(body.providers[0].supported, true);
  assert.equal(body.providers[0].balance.remaining, 12.5);
  assert.equal(Number.isFinite(body.providers[0].fetchedAt), true);
  assert.equal(body.providers[1].supported, false);
  assert.equal(body.providers[1].balance, null);
  assert.equal(balanceRequests, 1, "unsupported providers must not trigger balance requests");
}

async function testRoutes() {
  const plugin = await freshModule("routes");
  const routes = new Map();
  let authHeader = null;
  await plugin.apply(makeContext({
    sessions: { list: () => [] },
    persistence: { list: async () => [] },
    routes,
    fetchImpl: async (_url, init) => {
      authHeader = init?.headers?.authorization ?? null;
      return {
      ok: true,
      status: 200,
      json: async () => ({ is_available: true, balance_infos: [{ total_balance: "20.50", granted_balance: "3.00", topped_up_balance: "17.50", currency: "CNY" }] })
      };
    }
  }));

  const summary = makeResponse();
  await routes.get(plugin.SUMMARY_PATH)({
    method: "GET",
    url: plugin.SUMMARY_PATH,
    headers: { host: "localhost:3080" },
    socket: { remoteAddress: "127.0.0.1" }
  }, summary);
  const body = JSON.parse(summary.body);
  assert.equal(summary.status, 200);
  assert.equal(body.provider.id, "deepseek-official");
  assert.equal(body.provider.balance.remaining, 20.5);
  assert.equal(authHeader, "Bearer sk-test", "resolved credential object must be unwrapped to its value");

  const foreign = makeResponse();
  await routes.get(plugin.SUMMARY_PATH)({
    method: "GET",
    url: plugin.SUMMARY_PATH,
    headers: { host: "localhost:3080" },
    socket: { remoteAddress: "203.0.113.2" }
  }, foreign);
  assert.equal(foreign.status, 403);
}

async function testDetailAggregation() {
  const plugin = await freshModule("detail");
  const routes = new Map();
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const sessions = {
    list: () => [{
      id: "live-a",
      snapshotEvents: () => [
        usageEvent({ seq: 1, time: at, model: "deepseek/deepseek-chat", inputTokens: 1000, outputTokens: 500 }),
        usageEvent({ seq: 2, time: at + 1000, model: "deepseek/deepseek-reasoner", inputTokens: 2000, outputTokens: 1000, cacheReadTokens: 500 }),
        usageEvent({ seq: 3, time: at + 2000, model: "openai/gpt-4o-mini", inputTokens: 100, outputTokens: 50 })
      ]
    }]
  };
  const closed = [];
  const persistence = {
    list: async () => [{ header: { id: "persisted-a" } }],
    open: async (id, access) => {
      assert.equal(access, "read");
      return {
        read: async () => ({
          events: [usageEvent({ seq: 1, time: at - 86400000, model: "deepseek-chat", inputTokens: 300, outputTokens: 200 })]
        }),
        close: async () => closed.push(id)
      };
    }
  };
  await plugin.apply(makeContext({
    sessions,
    persistence,
    routes,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ is_available: true, balance_infos: [{ total_balance: "9.80", granted_balance: "1.30", topped_up_balance: "8.50", currency: "CNY" }] })
    })
  }));

  const detail = makeResponse();
  await routes.get(plugin.DETAIL_PATH)({
    method: "GET",
    url: plugin.DETAIL_PATH,
    headers: { host: "localhost:3080" },
    socket: { remoteAddress: "::1" }
  }, detail);
  const body = JSON.parse(detail.body);
  assert.equal(detail.status, 200);
  assert.equal(body.providers.length, 1);
  assert.equal(body.billing.total.tokens, 5650);
  assert.equal(body.billing.days.length, 2);
  assert.equal(body.billing.days[0].providers[0].id, "deepseek");
  assert.deepEqual(body.billing.providers.map((provider) => provider.id), ["deepseek", "openai"]);
  assert.deepEqual(body.billing.providers[0].models.map((model) => [model.id, model.tokens]), [
    ["deepseek-chat", 2000],
    ["deepseek-reasoner", 3500]
  ]);
  assert.deepEqual(body.billing.providers[1].models.map((model) => [model.id, model.tokens]), [
    ["gpt-4o-mini", 150]
  ]);
  assert.ok(body.billing.total.cost > 0);
  assert.equal(body.billing.days[0].date, "2026-08-19");
  assert.equal(body.billing.days[1].date, "2026-08-20");
  // Every opened read handle must be released.
  assert.deepEqual(closed, ["persisted-a"]);
}

async function testDetailDegradesGracefullyWhenBalanceFails() {
  const plugin = await freshModule("detail-fallback");
  const routes = new Map();
  await plugin.apply(makeContext({
    sessions: { list: () => [] },
    persistence: { list: async () => [] },
    routes,
    fetchImpl: async () => {
      throw new Error("network-down");
    }
  }));

  const detail = makeResponse();
  await routes.get(plugin.DETAIL_PATH)({
    method: "GET",
    url: plugin.DETAIL_PATH,
    headers: { host: "localhost:3080" },
    socket: { remoteAddress: "127.0.0.1" }
  }, detail);
  const body = JSON.parse(detail.body);
  assert.equal(detail.status, 200, "detail endpoint should degrade instead of failing hard");
  assert.equal(body.providers.length, 1);
  assert.equal(body.providers[0].id, "deepseek-official");
  assert.equal(body.provider.balance, null);
  assert.equal(Number.isFinite(body.provider.fetchedAt), true);
  assert.match(body.provider.error, /network-down/);
}

async function testLegacyHostSurfacesStillWork() {
  const plugin = await freshModule("legacy-seam");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const billing = await plugin.collectBilling(makeContext({
    // Pre-0.1.3 hosts: `.events` on the live session, listSnapshots/readFrom on persistence.
    sessions: {
      list: () => [{
        id: "legacy-live",
        events: [usageEvent({ seq: 1, time: at, model: "deepseek/deepseek-chat", inputTokens: 1000, outputTokens: 500 })]
      }]
    },
    persistence: {
      listSnapshots: async () => [{ header: { id: "legacy-stored" } }],
      readFrom: async () => ({
        events: [usageEvent({ seq: 1, time: at, model: "deepseek/deepseek-chat", inputTokens: 100, outputTokens: 100 })]
      })
    }
  }));
  assert.equal(billing.total.tokens, 1700);
}

async function testLiveSessionIsNotDoubleCounted() {
  const plugin = await freshModule("dedupe");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  let opened = 0;
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "shared-a",
        snapshotEvents: () => [usageEvent({ seq: 1, time: at, model: "deepseek/deepseek-chat", inputTokens: 1000, outputTokens: 500 })]
      }]
    },
    // The same session is also on disk; it must not be counted twice.
    persistence: {
      list: async () => [{ header: { id: "shared-a" } }],
      open: async () => {
        opened += 1;
        return { read: async () => ({ events: [] }), close: async () => {} };
      }
    }
  }));
  assert.equal(billing.total.tokens, 1500);
  assert.equal(opened, 0, "a live session must not be re-read from persistence");
}

async function testCompactionUsageIsAttributed() {
  const plugin = await freshModule("compaction");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "with-compaction",
        snapshotEvents: () => [
          usageEvent({ seq: 1, time: at, provider: "ais", model: "claude-fable-5", inputTokens: 1000, outputTokens: 500 }),
          // Same provider/model, but attribution sits flat on data.
          compactionEvent({ seq: 2, time: at + 1000, provider: "ais", model: "claude-fable-5", inputTokens: 2, outputTokens: 5750, cacheReadTokens: 18643, cacheWriteTokens: 117019 })
        ]
      }]
    },
    persistence: { list: async () => [] }
  }));
  assert.equal(billing.total.tokens, 1500 + 141414);
  const ids = billing.providers.map((provider) => provider.id);
  assert.ok(!ids.includes("unknown"), `compaction usage must not fall into the unknown bucket, got ${ids.join(",")}`);
  assert.deepEqual(ids, ["ais"], "compaction usage must fold into its real provider");
  const models = billing.providers[0].models.map((model) => model.id);
  assert.deepEqual(models, ["claude-fable-5"], "compaction usage must fold into its real model");
  assert.equal(billing.providers[0].tokens, 1500 + 141414);
}

async function testUnattributableUsageStillCounts() {
  const plugin = await freshModule("unattributed");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "no-source",
        // Neither path carries attribution; the tokens must still be reported.
        snapshotEvents: () => [{ seq: 1, time: at, type: "compaction/summary", data: { usage: { inputTokens: 10, outputTokens: 20 } } }]
      }]
    },
    persistence: { list: async () => [] }
  }));
  assert.equal(billing.total.tokens, 30, "usage without attribution must still be counted");
  assert.deepEqual(billing.providers.map((provider) => provider.id), ["unknown"]);
}

async function testSeededSubagentDoesNotDoubleCount() {
  const plugin = await freshModule("seeded");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  // Seeding copies the parent's history verbatim into the child's log, so the
  // same billed call appears under two different session ids.
  const shared = [
    usageEvent({ seq: 1, time: at, provider: "ais", model: "claude-fable-5", inputTokens: 1000, outputTokens: 500 }),
    usageEvent({ seq: 2, time: at + 1000, provider: "ais", model: "claude-fable-5", inputTokens: 2000, outputTokens: 800 })
  ];
  const childOwn = usageEvent({ seq: 3, time: at + 5000, provider: "ais", model: "claude-opus-5", inputTokens: 300, outputTokens: 100 });
  const billing = await plugin.collectBilling(makeContext({
    sessions: { list: () => [] },
    persistence: {
      list: async () => [{ header: { id: "parent" } }, { header: { id: "child" } }],
      open: async (id) => ({
        read: async () => ({ events: id === "parent" ? shared : [...shared.map((event) => ({ ...event })), childOwn] }),
        close: async () => {}
      })
    }
  }));
  // 1500 + 2800 counted once, plus the child's own 400.
  assert.equal(billing.total.tokens, 4700, "a seeded copy of a billed call must not be counted twice");
  const models = Object.fromEntries(billing.providers[0].models.map((model) => [model.id, model.tokens]));
  assert.equal(models["claude-fable-5"], 4300);
  assert.equal(models["claude-opus-5"], 400, "the subagent's own calls must survive deduplication");
}

async function testDistinctCallsAreNotMergedByDedupe() {
  const plugin = await freshModule("distinct");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "busy",
        snapshotEvents: () => [
          // Same usage numbers at different times: two real calls, not a copy.
          usageEvent({ seq: 1, time: at, provider: "ais", model: "claude-fable-5", inputTokens: 100, outputTokens: 50 }),
          usageEvent({ seq: 2, time: at + 1, provider: "ais", model: "claude-fable-5", inputTokens: 100, outputTokens: 50 }),
          // Identical timestamp but a different model: also two real calls.
          usageEvent({ seq: 3, time: at + 2, provider: "ais", model: "claude-opus-5", inputTokens: 70, outputTokens: 30 }),
          usageEvent({ seq: 4, time: at + 2, provider: "ais", model: "claude-fable-5", inputTokens: 70, outputTokens: 30 })
        ]
      }]
    },
    persistence: { list: async () => [] }
  }));
  assert.equal(billing.total.tokens, 500, "dedupe must not merge genuinely distinct calls");
}

async function testUsageWithoutTimestampIsNeverDeduped() {
  const plugin = await freshModule("no-time");
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "timeless",
        // Without a timestamp two calls cannot be told apart, so keep both.
        snapshotEvents: () => [
          { seq: 1, type: "assistant/message", data: { usage: { inputTokens: 100, outputTokens: 50 }, message: { source: { provider: "ais", model: "claude-fable-5" } } } },
          { seq: 2, type: "assistant/message", data: { usage: { inputTokens: 100, outputTokens: 50 }, message: { source: { provider: "ais", model: "claude-fable-5" } } } }
        ]
      }]
    },
    persistence: { list: async () => [] }
  }));
  assert.equal(billing.total.tokens, 300, "events without a timestamp must not be collapsed into one");
}

async function testLiveSessionSeededFromDiskIsNotDoubleCounted() {
  const plugin = await freshModule("live-seeded");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  // The active session was seeded from a parent, so its first calls also sit
  // on disk under the parent's id. Session-id dedupe cannot catch that.
  const shared = [
    usageEvent({ seq: 1, time: at, provider: "ais", model: "claude-fable-5", inputTokens: 1000, outputTokens: 0 }),
    usageEvent({ seq: 2, time: at + 1, provider: "ais", model: "claude-fable-5", inputTokens: 2000, outputTokens: 0 })
  ];
  const billing = await plugin.collectBilling(makeContext({
    sessions: {
      list: () => [{
        id: "live-child",
        snapshotEvents: () => [...shared, usageEvent({ seq: 3, time: at + 99, provider: "ais", model: "claude-fable-5", inputTokens: 500, outputTokens: 0 })]
      }]
    },
    persistence: {
      list: async () => [{ header: { id: "parent-on-disk" } }],
      open: async () => ({ read: async () => ({ events: shared.map((event) => ({ ...event })) }), close: async () => {} })
    }
  }));
  assert.equal(billing.total.tokens, 3500, "calls shared between a live session and a parent log must count once");
}

async function testUnreadableSessionIsSkipped() {
  const plugin = await freshModule("corrupt");
  const at = Date.UTC(2026, 7, 20, 10, 0, 0);
  const billing = await plugin.collectBilling(makeContext({
    sessions: { list: () => [] },
    persistence: {
      list: async () => [{ header: { id: "broken" } }, { header: { id: "good" } }],
      open: async (id) => {
        if (id === "broken") throw new Error("corrupt log");
        return {
          read: async () => ({
            events: [usageEvent({ seq: 1, time: at, model: "deepseek/deepseek-chat", inputTokens: 200, outputTokens: 100 })]
          }),
          close: async () => {}
        };
      }
    }
  }));
  assert.equal(billing.total.tokens, 300, "a broken session must not void the report");
}

const root = await mkdtemp(join(tmpdir(), "dsh-usage-lite-"));
const originalFetch = globalThis.fetch;
try {
  process.env.DSH_HOME = root;
  await testRoutes();
  await testConfiguredProviderAccounts();
  await testExplicitProviderAggregation();
  await testDetailAggregation();
  await testDetailDegradesGracefullyWhenBalanceFails();
  await testLegacyHostSurfacesStillWork();
  await testLiveSessionIsNotDoubleCounted();
  await testCompactionUsageIsAttributed();
  await testUnattributableUsageStillCounts();
  await testSeededSubagentDoesNotDoubleCount();
  await testDistinctCallsAreNotMergedByDedupe();
  await testUsageWithoutTimestampIsNeverDeduped();
  await testLiveSessionSeededFromDiskIsNotDoubleCounted();
  await testUnreadableSessionIsSkipped();
  console.log("server ok");
} finally {
  globalThis.fetch = originalFetch;
  await rm(root, { recursive: true, force: true });
}
