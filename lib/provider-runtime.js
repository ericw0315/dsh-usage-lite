import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function safeErrorCode(error, fallback = "upstream-error") {
  const code = typeof error?.code === "string" ? error.code : "";
  if (code === "not-configured" || code === "unsupported" || code === "upstream-error" || code === "invalid-response") {
    return code;
  }
  return fallback;
}

function configuredFromErrorCode(code) {
  return code === "not-configured" ? false : true;
}

function sharedAccount(provider) {
  return {
    id: provider?.id,
    displayName: provider?.displayName,
    adapterId: provider?.adapterId
  };
}

function loadError(filename, code, reason, cause) {
  const error = new Error(`${filename}: ${reason}`);
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  return error;
}

export function tokenCountOf(usage) {
  return ["inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"]
    .reduce((total, key) => total + Math.max(0, Number(usage?.[key]) || 0), 0);
}

export function validateAdapter(adapter, filename) {
  assertObject(adapter, filename ?? "adapter");
  if (typeof adapter.id !== "string" || adapter.id.trim() === "") {
    throw new TypeError(`${filename} adapter must declare a string id`);
  }
  assertObject(adapter.capabilities, `${filename} capabilities`);
  if (typeof adapter.matches !== "function") {
    throw new TypeError(`${filename} adapter must declare matches(config)`);
  }
  if (typeof adapter.normalizeConfig !== "function") {
    throw new TypeError(`${filename} adapter must declare normalizeConfig(config)`);
  }
  const { balance, pricing } = adapter.capabilities;
  if (typeof balance !== "boolean" || typeof pricing !== "boolean") {
    throw new TypeError(`${filename} capabilities must declare boolean balance and pricing flags`);
  }
  if (balance !== (typeof adapter.fetchBalance === "function")) {
    throw new TypeError(`${filename} capabilities.balance must match fetchBalance presence`);
  }
  if (pricing !== (typeof adapter.resolvePrice === "function")) {
    throw new TypeError(`${filename} capabilities.pricing must match resolvePrice presence`);
  }
  return adapter;
}

export function matchProvider(adapters, config) {
  const matches = [];
  for (const adapter of Array.isArray(adapters) ? adapters : []) {
    if (typeof adapter?.matches === "function" && adapter.matches(config)) matches.push(adapter);
  }
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  const ids = matches.map((adapter) => `${adapter.id}`).join(", ");
  const error = new Error(`ambiguous-adapter: ${ids}`);
  error.code = "ambiguous-adapter";
  throw error;
}

export function normalizeProvider(adapters, config) {
  const adapter = matchProvider(adapters, config);
  if (!adapter) return { adapter: null, provider: config };
  return { adapter, provider: adapter.normalizeConfig(config) };
}

export async function fetchProviderBalance(adapter, config, dependencies = {}) {
  const account = sharedAccount(config);
  if (!adapter?.capabilities?.balance || typeof adapter.fetchBalance !== "function") {
    return { ...account, supported: false, configured: false, balance: null, error: "unsupported" };
  }

  const resolveCredential = typeof dependencies.resolveCredential === "function"
    ? dependencies.resolveCredential
    : async () => null;
  const fetchImpl = typeof dependencies.fetch === "function" ? dependencies.fetch : globalThis.fetch;
  const now = typeof dependencies.now === "function" ? dependencies.now : Date.now;

  try {
    const result = await adapter.fetchBalance({
      config,
      resolveCredential,
      fetch: fetchImpl,
      now
    });
    if (result === null || typeof result !== "object" || Array.isArray(result)) {
      return { ...account, supported: true, configured: true, balance: null, error: "invalid-response" };
    }
    if (result.error) {
      const code = safeErrorCode(result, "upstream-error");
      return {
        ...account,
        supported: true,
        configured: configuredFromErrorCode(code),
        balance: null,
        error: code
      };
    }
    if (!("balance" in result)) {
      return { ...account, supported: true, configured: true, balance: null, error: "invalid-response" };
    }
    const balance = result.balance;
    return {
      ...account,
      supported: true,
      configured: true,
      fetchedAt: Number.isFinite(result.fetchedAt) ? result.fetchedAt : now(),
      balance: balance === null || balance === void 0 ? null : balance
    };
  } catch (error) {
    const code = safeErrorCode(error);
    return {
      ...account,
      supported: true,
      configured: configuredFromErrorCode(code),
      balance: null,
      error: code
    };
  }
}

export function resolveProviderPrice(adapter, context) {
  const unpricedTokens = tokenCountOf(context?.usage);
  if (!adapter?.capabilities?.pricing || typeof adapter.resolvePrice !== "function") {
    return { status: "unknown", unpricedTokens };
  }
  const quote = adapter.resolvePrice(context);
  if (quote?.status === "priced" || quote?.status === "partial") return quote;
  return { status: "unknown", unpricedTokens };
}

export async function loadProviderAdapters(directoryURL = new URL("./providers/", import.meta.url)) {
  const directoryPath = fileURLToPath(directoryURL);
  const names = (await readdir(directoryPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const adapters = [];
  const byId = new Map();

  for (const name of names) {
    const moduleURL = pathToFileURL(join(directoryPath, name)).href;
    let loaded;
    try {
      loaded = await import(moduleURL);
    } catch (error) {
      throw loadError(name, "adapter-import-failed", "import-failed", error);
    }
    if (!Object.hasOwn(loaded, "default")) {
      throw loadError(name, "invalid-adapter-export", "default export required");
    }
    const adapter = validateAdapter(loaded.default, name);
    const previous = byId.get(adapter.id);
    if (previous) {
      const error = new Error(`duplicate adapter id ${adapter.id} in ${previous.filename} and ${name}`);
      error.code = "duplicate-adapter";
      throw error;
    }
    const frozen = Object.freeze({
      ...adapter,
      capabilities: Object.freeze({ ...adapter.capabilities })
    });
    byId.set(adapter.id, { filename: name, adapter: frozen });
    adapters.push(frozen);
  }

  return Object.freeze(adapters);
}
