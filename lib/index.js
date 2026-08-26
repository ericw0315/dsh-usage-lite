import {
  AMBIGUOUS_ADAPTER,
  fetchProviderBalance,
  loadProviderAdapters,
  matchProvider,
  normalizeProvider,
  resolveProviderPrice
} from "./provider-runtime.js";
import { DEFAULT_ACCOUNT } from "./providers/deepseek.js";

const name = "usage-lite";
const inject = ["webServer", "credentials", "sessions", "sessionPersistence", "settings"];

export const SUMMARY_PATH = "/api/usage-lite/summary";
export const DETAIL_PATH = "/api/usage-lite/detail";

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

function emptyTotals(shape = {}) {
  return {
    tokens: 0,
    costs: new Map(),
    unpricedTokens: 0,
    ...shape
  };
}

function addQuote(target, quote) {
  if (!target || !quote) return;
  target.unpricedTokens += Math.max(0, Number(quote.unpricedTokens) || 0);
  if ((quote.status === "priced" || quote.status === "partial") && typeof quote.currency === "string" && quote.currency !== "") {
    const amount = Number(quote.amount) || 0;
    target.costs.set(quote.currency, (target.costs.get(quote.currency) ?? 0) + amount);
  }
}

function serializeCosts(costs) {
  return [...costs.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => ({ currency, amount: Number(amount.toFixed(6)) }));
}

function serializeTotals(entry) {
  return {
    ...entry,
    costs: serializeCosts(entry.costs),
    unpricedTokens: entry.unpricedTokens
  };
}

function configuredAdapterMapOf(ctx, adapters) {
  const configured = new Map();
  for (const raw of configuredProviders(ctx)) {
    const { adapter, provider } = normalizeProvider(adapters, raw);
    configured.set(provider.id, adapter);
  }
  return configured;
}

function modelProviderPrefixOf(model) {
  if (typeof model !== "string" || model === "") return null;
  const slash = model.indexOf("/");
  if (slash <= 0) return null;
  const prefix = model.slice(0, slash).trim();
  return prefix === "" ? null : prefix;
}

function pricingConfigOf(providerId, modelId) {
  const explicitProviderId = typeof providerId === "string" && providerId.trim() !== ""
    ? providerId.trim()
    : null;
  const modelProvider = modelProviderPrefixOf(modelId);
  if (explicitProviderId) return { id: explicitProviderId };
  if (modelProvider) return { id: modelProvider };
  return null;
}

function pricingModelOf(modelId, providerId, adapter) {
  const prefix = modelProviderPrefixOf(modelId);
  if (prefix === providerId || prefix === adapter?.id) return modelOf(modelId);
  return modelId;
}

function pricingQuoteOf(adapters, configuredAdapters, modelId, usage, occurredAt, providerId) {
  try {
    const adapter = configuredAdapters.has(providerId)
      ? configuredAdapters.get(providerId)
      : matchProvider(adapters, pricingConfigOf(providerId, modelId));
    const resolvedAdapter = adapter === AMBIGUOUS_ADAPTER ? null : adapter;
    return resolveProviderPrice(resolvedAdapter, {
      model: pricingModelOf(modelId, providerId, resolvedAdapter),
      usage,
      occurredAt
    });
  } catch {
    return resolveProviderPrice(null, { usage });
  }
}

function foldEvent(target, event, adapters, configuredAdapters) {
  const usage = event?.data?.usage;
  if (usage === null || typeof usage !== "object") return;
  const source = event?.data?.message?.source;
  const modelId = source?.model ?? "unknown";
  const providerId = typeof source?.provider === "string" && source.provider.trim() !== ""
    ? source.provider.trim()
    : providerOf(modelId);
  const baseModel = modelOf(modelId);
  const day = dayKeyOf(event?.time ?? Date.now());
  const entry = target.get(day) ?? emptyTotals({
    date: day,
    providers: new Map()
  });
  const tokens = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0) + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
  const quote = pricingQuoteOf(adapters, configuredAdapters, modelId, usage, event?.time ?? Date.now(), providerId);
  entry.tokens += tokens;
  addQuote(entry, quote);
  const provider = entry.providers.get(providerId) ?? emptyTotals({ id: providerId, models: new Map() });
  provider.tokens += tokens;
  addQuote(provider, quote);
  const model = provider.models.get(baseModel) ?? emptyTotals({ id: baseModel });
  model.tokens += tokens;
  addQuote(model, quote);
  provider.models.set(baseModel, model);
  entry.providers.set(providerId, provider);
  target.set(day, entry);
}

function serializeProvider(provider) {
  return serializeTotals({
    ...provider,
    models: [...provider.models.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((model) => serializeTotals(model))
  });
}

async function collectEvents(ctx) {
  const events = [];
  const sessions = ctx.get?.("sessions");
  for (const session of sessions?.list?.() ?? []) {
    for (const event of session?.events ?? []) events.push(event);
  }
  const persistence = ctx.get?.("sessionPersistence");
  for (const snapshot of await (persistence?.listSnapshots?.() ?? [])) {
    const id = snapshot?.header?.id;
    if (!id) continue;
    const persisted = await persistence.readFrom?.(id, 0);
    for (const event of persisted?.events ?? []) events.push(event);
  }
  return events;
}

export async function collectBilling(ctx, adapters = null) {
  const activeAdapters = Array.isArray(adapters) ? adapters : await loadProviderAdapters();
  const configuredAdapters = configuredAdapterMapOf(ctx, activeAdapters);
  const days = new Map();
  for (const event of await collectEvents(ctx)) foldEvent(days, event, activeAdapters, configuredAdapters);
  const providerTotals = new Map();
  for (const day of days.values()) {
    for (const dayProvider of day.providers.values()) {
      const provider = providerTotals.get(dayProvider.id) ?? emptyTotals({ id: dayProvider.id, models: new Map() });
      provider.tokens += dayProvider.tokens;
      provider.unpricedTokens += dayProvider.unpricedTokens;
      for (const [currency, amount] of dayProvider.costs.entries()) {
        provider.costs.set(currency, (provider.costs.get(currency) ?? 0) + amount);
      }
      for (const dayModel of dayProvider.models.values()) {
        const model = provider.models.get(dayModel.id) ?? emptyTotals({ id: dayModel.id });
        model.tokens += dayModel.tokens;
        model.unpricedTokens += dayModel.unpricedTokens;
        for (const [currency, amount] of dayModel.costs.entries()) {
          model.costs.set(currency, (model.costs.get(currency) ?? 0) + amount);
        }
        provider.models.set(dayModel.id, model);
      }
      providerTotals.set(provider.id, provider);
    }
  }
  const total = [...days.values()].reduce((acc, day) => {
    acc.tokens += day.tokens;
    acc.unpricedTokens += day.unpricedTokens;
    for (const [currency, amount] of day.costs.entries()) {
      acc.costs.set(currency, (acc.costs.get(currency) ?? 0) + amount);
    }
    return acc;
  }, emptyTotals());
  const rows = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => serializeTotals({
      ...entry,
      providers: [...entry.providers.values()]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(serializeProvider)
    }));
  return {
    total: serializeTotals(total),
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
    ...DEFAULT_ACCOUNT,
    apiKeyEnv: typeof configured?.apiKeyEnv === "string" ? configured.apiKeyEnv : DEFAULT_ACCOUNT.apiKeyEnv,
    baseURL: typeof configured?.baseURL === "string" ? configured.baseURL : DEFAULT_ACCOUNT.baseURL
  }];
  const piProviders = settings?.get?.("llm-pi-ai")?.providers;
  if (piProviders !== null && typeof piProviders === "object") {
    for (const [id, profile] of Object.entries(piProviders)) {
      if (id === DEFAULT_ACCOUNT.id || profile === null || typeof profile !== "object") continue;
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

async function collectProviderAccounts(ctx, adapters) {
  return Promise.all(configuredProviders(ctx).map(async (raw) => {
    const { adapter, provider } = normalizeProvider(adapters, raw);
    return fetchProviderBalance(adapter, provider, {
      resolveCredential: (name) => ctx.credentials?.resolve?.(name),
      fetch: globalThis.fetch,
      now: () => Date.now()
    });
  }));
}

export async function apply(ctx) {
  const adapters = await loadProviderAdapters();
  ctx.webServer.register({
    path: SUMMARY_PATH,
    handler: async (req, res) => {
      if (rejectForeignCaller(req, res)) return;
      const providers = await collectProviderAccounts(ctx, adapters);
      json(res, 200, { ok: true, provider: providers[0] ?? null });
    }
  });

  ctx.webServer.register({
    path: DETAIL_PATH,
    handler: async (req, res) => {
      if (rejectForeignCaller(req, res)) return;
      const billing = await collectBilling(ctx, adapters);
      const providers = await collectProviderAccounts(ctx, adapters);
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
