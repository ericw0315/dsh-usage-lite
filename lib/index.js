const name = "usage-lite";
const inject = ["webServer", "credentials", "sessions", "sessionPersistence", "settings"];

export const SUMMARY_PATH = "/api/usage-lite/summary";
export const DETAIL_PATH = "/api/usage-lite/detail";

const DEEPSEEK_PROVIDER = {
  id: "deepseek-official",
  displayName: "DeepSeek",
  currency: "CNY",
  apiKeyEnv: "DEEPSEEK_API_KEY",
  baseURL: "https://api.deepseek.com"
};

const PRICE_BOOK = {
  "deepseek-chat": { input: 2, output: 8, cacheRead: 0.5, cacheWrite: 2 },
  "deepseek-reasoner": { input: 4, output: 16, cacheRead: 1, cacheWrite: 4 }
};

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-cache"
  });
  res.end(body);
}

function isLoopbackAddress(address) {
  if (typeof address !== "string") return false;
  const value = address.toLowerCase();
  if (value === "::1") return true;
  const ipv4 = value.startsWith("::ffff:") ? value.slice(7) : value;
  const parts = ipv4.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function hostNameOf(value) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (host.startsWith("[")) {
    const close = host.indexOf("]");
    if (close <= 1) return null;
    return host.slice(1, close);
  }
  const firstColon = host.indexOf(":");
  const lastColon = host.lastIndexOf(":");
  if (firstColon !== lastColon) return host;
  if (lastColon === -1) return host;
  return host.slice(0, lastColon);
}

function rejectForeignCaller(req, res) {
  if (req.method !== "GET") {
    json(res, 405, { ok: false, error: "method-not-allowed" });
    return true;
  }
  const peer = req.socket?.remoteAddress;
  const host = hostNameOf(req.headers?.host);
  if (isLoopbackAddress(peer) && (host === "localhost" || isLoopbackAddress(host))) return false;
  json(res, 403, { ok: false, error: "forbidden" });
  return true;
}

function providerOf(model) {
  if (typeof model !== "string" || model === "") return "deepseek";
  const slash = model.indexOf("/");
  if (slash > 0) return model.slice(0, slash);
  return model.startsWith("deepseek") ? "deepseek" : "unknown";
}

function modelOf(model) {
  if (typeof model !== "string" || model === "") return "unknown";
  const slash = model.indexOf("/");
  return slash > 0 ? model.slice(slash + 1) : model;
}

function dayKeyOf(time) {
  const date = new Date(time);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function priceFor(model) {
  return PRICE_BOOK[model] ?? PRICE_BOOK["deepseek-chat"];
}

function costOf(usage, modelName) {
  const price = priceFor(modelName);
  return (
    ((usage.inputTokens ?? 0) / 1_000_000) * price.input +
    ((usage.outputTokens ?? 0) / 1_000_000) * price.output +
    ((usage.cacheReadTokens ?? 0) / 1_000_000) * price.cacheRead +
    ((usage.cacheWriteTokens ?? 0) / 1_000_000) * price.cacheWrite
  );
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * Model/provider attribution, which lives at different paths per event type:
 * assistant/message nests it under data.message.source, while compaction/summary
 * (and other direct LLM calls) carry it flat on data. Without the flat fallback
 * those events fall through to the "unknown" bucket even though the data is present.
 */
function attributionOf(event) {
  const data = event?.data;
  const source = data?.message?.source;
  return {
    model: nonEmptyString(source?.model) ?? nonEmptyString(data?.model),
    provider: nonEmptyString(source?.provider) ?? nonEmptyString(data?.provider)
  };
}

function foldEvent(target, event) {
  const usage = event?.data?.usage;
  if (usage === null || typeof usage !== "object") return;
  const attribution = attributionOf(event);
  const modelId = attribution.model ?? "unknown";
  const providerId = attribution.provider ?? providerOf(modelId);
  const baseModel = modelOf(modelId);
  const day = dayKeyOf(event?.time ?? Date.now());
  const entry = target.get(day) ?? {
    date: day,
    tokens: 0,
    cost: 0,
    providers: new Map()
  };
  const tokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0) + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
  const cost = costOf(usage, baseModel);
  entry.tokens += tokens;
  entry.cost += cost;
  const provider = entry.providers.get(providerId) ?? { id: providerId, tokens: 0, cost: 0, models: new Map() };
  provider.tokens += tokens;
  provider.cost += cost;
  const model = provider.models.get(baseModel) ?? { id: baseModel, tokens: 0, cost: 0 };
  model.tokens += tokens;
  model.cost += cost;
  provider.models.set(baseModel, model);
  entry.providers.set(providerId, provider);
  target.set(day, entry);
}

function serializeProvider(provider) {
  return {
    id: provider.id,
    tokens: provider.tokens,
    cost: Number(provider.cost.toFixed(6)),
    models: [...provider.models.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((model) => ({ ...model, cost: Number(model.cost.toFixed(6)) }))
  };
}

function liveEventsOf(session) {
  // Host >= dsh-v0.1.3-alpha.1 exposes snapshotEvents(); older hosts had `.events`.
  if (typeof session?.snapshotEvents === "function") return session.snapshotEvents() ?? [];
  return session?.events ?? [];
}

async function persistedEventsOf(persistence, id) {
  // Host >= dsh-v0.1.3-alpha.1: open(id, 'read') -> handle.read() -> handle.close().
  if (typeof persistence?.open === "function") {
    const handle = await persistence.open(id, "read");
    try {
      const result = await handle.read();
      return result?.events ?? [];
    } finally {
      await handle.close?.();
    }
  }
  // Legacy seam kept for older hosts.
  const persisted = await persistence?.readFrom?.(id, 0);
  return persisted?.events ?? [];
}

async function listStoredSessions(persistence) {
  if (typeof persistence?.list === "function") return await persistence.list() ?? [];
  return await persistence?.listSnapshots?.() ?? [];
}

/**
 * Identity of one billed LLM call.
 *
 * Seeding a subagent copies the parent's history verbatim into the child's log,
 * so the same already-billed call exists under two session ids. Deduping by
 * session id cannot see that; deduping by call identity can. The timestamp plus
 * the exact token counts and attribution is unique per call (verified against
 * real logs: zero collisions within a single session), while a copy reproduces
 * every one of those fields.
 */
function callFingerprint(event) {
  const usage = event?.data?.usage;
  if (usage === null || typeof usage !== "object") return undefined;
  const time = event?.time;
  // Without a timestamp two distinct calls could collide, so never dedupe them.
  if (typeof time !== "number") return undefined;
  const attribution = attributionOf(event);
  return [
    time,
    usage.inputTokens ?? 0,
    usage.outputTokens ?? 0,
    usage.cacheReadTokens ?? 0,
    usage.cacheWriteTokens ?? 0,
    usage.totalTokens ?? 0,
    attribution.model ?? "",
    attribution.provider ?? ""
  ].join("|");
}

async function collectEvents(ctx) {
  const events = [];
  const seen = new Set();
  const sessions = ctx.get?.("sessions");
  for (const session of sessions?.list?.() ?? []) {
    if (typeof session?.id === "string") seen.add(session.id);
    for (const event of liveEventsOf(session)) events.push(event);
  }
  const persistence = ctx.get?.("sessionPersistence");
  for (const snapshot of await listStoredSessions(persistence)) {
    const id = snapshot?.header?.id;
    // A live session's events are already counted above and also exist on disk.
    if (!id || seen.has(id)) continue;
    try {
      for (const event of await persistedEventsOf(persistence, id)) events.push(event);
    } catch {
      // One unreadable or corrupt session must not void the whole report.
      continue;
    }
  }
  return events;
}

/** Drop repeat copies of one billed call, keeping the first occurrence. */
function dedupeBilledCalls(events) {
  const seenCalls = new Set();
  const unique = [];
  for (const event of events) {
    const fingerprint = callFingerprint(event);
    if (fingerprint !== undefined) {
      if (seenCalls.has(fingerprint)) continue;
      seenCalls.add(fingerprint);
    }
    unique.push(event);
  }
  return unique;
}

export async function collectBilling(ctx) {
  const days = new Map();
  for (const event of dedupeBilledCalls(await collectEvents(ctx))) foldEvent(days, event);
  const providerTotals = new Map();
  for (const day of days.values()) {
    for (const dayProvider of day.providers.values()) {
      const provider = providerTotals.get(dayProvider.id) ?? { id: dayProvider.id, tokens: 0, cost: 0, models: new Map() };
      provider.tokens += dayProvider.tokens;
      provider.cost += dayProvider.cost;
      for (const dayModel of dayProvider.models.values()) {
        const model = provider.models.get(dayModel.id) ?? { id: dayModel.id, tokens: 0, cost: 0 };
        model.tokens += dayModel.tokens;
        model.cost += dayModel.cost;
        provider.models.set(dayModel.id, model);
      }
      providerTotals.set(provider.id, provider);
    }
  }
  const rows = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      date: entry.date,
      tokens: entry.tokens,
      cost: Number(entry.cost.toFixed(6)),
      providers: [...entry.providers.values()]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(serializeProvider)
    }));
  const total = rows.reduce((acc, day) => {
    acc.tokens += day.tokens;
    acc.cost += day.cost;
    return acc;
  }, { tokens: 0, cost: 0 });
  return {
    total: { tokens: total.tokens, cost: Number(total.cost.toFixed(6)) },
    providers: [...providerTotals.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(serializeProvider),
    days: rows
  };
}

function configuredProviders(ctx) {
  const settings = ctx.get?.("settings");
  const configured = settings?.get?.("llm-deepseek");
  const providers = [{
    ...DEEPSEEK_PROVIDER,
    apiKeyEnv: typeof configured?.apiKeyEnv === "string" ? configured.apiKeyEnv : DEEPSEEK_PROVIDER.apiKeyEnv,
    baseURL: typeof configured?.baseURL === "string" ? configured.baseURL : DEEPSEEK_PROVIDER.baseURL
  }];
  const piProviders = settings?.get?.("llm-pi-ai")?.providers;
  if (piProviders !== null && typeof piProviders === "object") {
    for (const [id, profile] of Object.entries(piProviders)) {
      if (id === DEEPSEEK_PROVIDER.id || profile === null || typeof profile !== "object") continue;
      providers.push({
        id,
        displayName: typeof profile.displayName === "string" && profile.displayName.trim() !== "" ? profile.displayName : id,
        apiKeyEnv: typeof profile.apiKeyEnv === "string" ? profile.apiKeyEnv : void 0,
        baseURL: typeof profile.baseURL === "string" ? profile.baseURL : void 0
      });
    }
  }
  return [providers[0], ...providers.slice(1).sort((a, b) => a.id.localeCompare(b.id))];
}

async function fetchDeepSeekBalance(ctx, provider) {
  const credential = await ctx.credentials?.resolve?.(provider.apiKeyEnv);
  const apiKey = typeof credential === "string" ? credential : credential?.value;
  if (!apiKey) {
    return {
      id: provider.id,
      displayName: provider.displayName,
      supported: true,
      configured: false,
      balance: null
    };
  }
  const response = await globalThis.fetch(`${provider.baseURL}/user/balance`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    }
  });
  if (!response?.ok) {
    throw new Error(`upstream ${response?.status ?? "failed"}`);
  }
  const payload = await response.json();
  const info = Array.isArray(payload?.balance_infos) ? payload.balance_infos[0] : null;
  return {
    id: provider.id,
    displayName: provider.displayName,
    supported: true,
    configured: true,
    fetchedAt: Date.now(),
    balance: info === null ? null : {
      remaining: Number(info.total_balance ?? 0),
      granted: Number(info.granted_balance ?? 0),
      toppedUp: Number(info.topped_up_balance ?? 0),
      currency: info.currency || provider.currency
    }
  };
}

function unsupportedProvider(provider) {
  return {
    id: provider.id,
    displayName: provider.displayName,
    supported: false,
    configured: true,
    balance: null
  };
}

function errorProvider(provider, error) {
  return {
    id: provider.id,
    displayName: provider.displayName,
    supported: true,
    configured: true,
    fetchedAt: Date.now(),
    balance: null,
    error: String(error)
  };
}

async function collectProviderAccounts(ctx) {
  return Promise.all(configuredProviders(ctx).map(async (provider) => {
    if (provider.id !== DEEPSEEK_PROVIDER.id) return unsupportedProvider(provider);
    try {
      return await fetchDeepSeekBalance(ctx, provider);
    } catch (error) {
      return errorProvider(provider, error);
    }
  }));
}

export async function apply(ctx) {
  ctx.webServer.register({
    path: SUMMARY_PATH,
    handler: async (req, res) => {
      if (rejectForeignCaller(req, res)) return;
      const providers = await collectProviderAccounts(ctx);
      json(res, 200, { ok: true, provider: providers[0] ?? null });
    }
  });

  ctx.webServer.register({
    path: DETAIL_PATH,
    handler: async (req, res) => {
      if (rejectForeignCaller(req, res)) return;
      const billing = await collectBilling(ctx);
      const providers = await collectProviderAccounts(ctx);
      json(res, 200, {
        ok: true,
        providers,
        provider: providers[0] ?? null,
        billing
      });
    }
  });
}

export { inject, name };
