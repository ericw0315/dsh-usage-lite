import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const react = require("react");
const jsxRuntime = require("react/jsx-runtime");
const { renderToStaticMarkup } = require("react-dom/server");

const Stub = ({ children }) => children ?? null;
const primitives = new Proxy({}, { get: () => Stub });

let captured = null;
let injectedStyleText = "";
globalThis.window = { __ModuleLoader__: { load: (entry) => { captured = entry; } } };
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, textContent: "", appendChild: () => {} }),
  head: { appendChild: (node) => { injectedStyleText = node.textContent; } }
};

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, "lib", "client.js"), "utf8");
if (!source.includes("sidebar.footer.action")) throw new Error("must register sidebar footer action");
if (!source.includes("/api/usage-lite/summary")) throw new Error("must fetch summary endpoint");
if (!source.includes("/api/usage-lite/detail")) throw new Error("must fetch detail endpoint");
if (!source.includes("action.toggleVisibility")) throw new Error("must expose balance visibility control");
if (!source.includes("action.refresh")) throw new Error("must expose refresh control");

new Function(source)();
const exports_ = captured.factory((spec) => {
  if (spec === "react") return react;
  if (spec === "react/jsx-runtime") return jsxRuntime;
  if (spec === "react-dom") return { createPortal: (node) => node };
  if (spec === "@deepseek-ai/dsh-client-ui-primitives") return primitives;
  throw new Error(`unexpected require: ${spec}`);
});

if (typeof exports_.mergeRefreshResults !== "function") throw new Error("missing refresh merge helper");
if (typeof exports_.ProviderAccountsView !== "function") throw new Error("missing provider accounts view component");
if (typeof exports_.BillingView !== "function") throw new Error("missing billing view component");
if (typeof exports_.buildUsageHeatmap !== "function") throw new Error("missing usage heatmap helper");
if (typeof exports_.selectSummaryProvider !== "function") throw new Error("missing summary provider selection helper");
if (typeof exports_.fmtCosts !== "function") throw new Error("missing multi-currency formatter");
if (typeof exports_.refreshFailedOf !== "function") throw new Error("missing refresh failure classifier");
const formatted = exports_.fmtCosts([
  { currency: "CNY", amount: 0.18 },
  { currency: "USD", amount: 0.04 }
]);
if (!formatted.includes("¥") || !formatted.includes("$") || !formatted.includes(" + ")) {
  throw new Error("must render separate CNY and USD estimates");
}
const selectedSummaryProvider = exports_.selectSummaryProvider({
  providers: [
    { id: "deepseek-official", supported: true, balance: { remaining: 8.8 } },
    { id: "openai-main", supported: true, balance: { remaining: 4.2 } }
  ],
  summaryProvider: { id: "deepseek-official", supported: true, balance: { remaining: 9.9 } },
  selectedProviderId: "openai-main"
});
if (selectedSummaryProvider?.id !== "openai-main") throw new Error("saved provider must drive the collapsed summary");
const unsupportedSummaryProvider = exports_.selectSummaryProvider({
  providers: [
    { id: "deepseek-official", supported: true, balance: { remaining: 8.8 } },
    { id: "openai-main", supported: false, balance: null }
  ],
  summaryProvider: { id: "deepseek-official", supported: true, balance: { remaining: 8.8 } },
  selectedProviderId: "openai-main"
});
if (unsupportedSummaryProvider?.id !== "deepseek-official") throw new Error("unsupported providers must not become the collapsed summary");
const noSupportedSummaryProvider = exports_.selectSummaryProvider({
  providers: [
    { id: "openai-main", supported: false, balance: null },
    { id: "custom-gateway", supported: false, balance: null }
  ],
  summaryProvider: { id: "openai-main", supported: false, balance: null },
  selectedProviderId: "openai-main"
});
if (noSupportedSummaryProvider !== null) throw new Error("all-unsupported accounts must produce an empty collapsed summary");
const mergedRefresh = exports_.mergeRefreshResults({
  summaryResult: { status: "fulfilled", value: { provider: { id: "deepseek-official", balance: { remaining: 8.8, currency: "CNY" } } } },
  detailResult: { status: "rejected", reason: new Error("boom") },
  previousDetail: { providers: [{ id: "deepseek-official", displayName: "DeepSeek" }], billing: { total: { tokens: 0, costs: [], unpricedTokens: 0 }, days: [] } }
});
if (mergedRefresh.summary?.provider?.balance?.remaining !== 8.8) throw new Error("summary must still update when detail refresh fails");
if (mergedRefresh.detail?.providers?.length !== 1) throw new Error("detail fallback must preserve previous provider list");
const preservedRefresh = exports_.mergeRefreshResults({
  summaryResult: { status: "fulfilled", value: { provider: { id: "deepseek-official", error: "network-down", balance: null } } },
  detailResult: {
    status: "fulfilled",
    value: {
      providers: [{ id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, error: "network-down", balance: null }],
      provider: { id: "deepseek-official", error: "network-down", balance: null },
      billing: { total: { tokens: 0, costs: [], unpricedTokens: 0 }, providers: [], days: [] }
    }
  },
  previousDetail: {
    providers: [{ id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, fetchedAt: 1234, balance: { remaining: 8.8, currency: "CNY" } }],
    provider: { id: "deepseek-official", fetchedAt: 1234, balance: { remaining: 8.8, currency: "CNY" } },
    billing: { total: { tokens: 0, costs: [], unpricedTokens: 0 }, providers: [], days: [] }
  }
});
if (preservedRefresh.detail?.provider?.balance?.remaining !== 8.8 || preservedRefresh.detail?.provider?.fetchedAt !== 1234) {
  throw new Error("failed balance refresh must preserve the last successful balance and fetch time");
}
const initialFailedRefresh = exports_.mergeRefreshResults({
  summaryResult: { status: "rejected", reason: new Error("offline") },
  detailResult: { status: "rejected", reason: new Error("offline") },
  previousDetail: null
});
if (initialFailedRefresh.detail !== null) throw new Error("an initial request failure must not fabricate a configured provider");

const expectedAccountStates = {
  summaryResult: {
    status: "fulfilled",
    value: { provider: { id: "deepseek-official", configured: false, balance: null, error: "not-configured" } }
  },
  detailResult: {
    status: "fulfilled",
    value: {
      providers: [
        { id: "deepseek-official", configured: false, balance: null, error: "not-configured" },
        { id: "openai-main", supported: false, balance: null, error: "unsupported" }
      ]
    }
  }
};
if (exports_.refreshFailedOf(expectedAccountStates)) {
  throw new Error("unsupported and not-configured accounts must not make a successful panel refresh look failed");
}
if (!exports_.refreshFailedOf({
  summaryResult: { status: "fulfilled", value: { provider: { id: "deepseek-official", error: "upstream-error" } } },
  detailResult: { status: "fulfilled", value: { providers: [] } }
})) {
  throw new Error("unexpected account errors must still make the panel refresh look failed");
}
if (!exports_.refreshFailedOf({
  summaryResult: { status: "rejected", reason: new Error("offline") },
  detailResult: { status: "fulfilled", value: { providers: [] } }
})) {
  throw new Error("request rejection must still make the panel refresh look failed");
}

const labels = {
  "provider.balance": "Current balance",
  "provider.granted": "Granted",
  "provider.toppedUp": "Topped up",
  "provider.unavailable": "Unavailable",
  "provider.unsupported": "Balance lookup is not supported",
  "provider.notConfigured": "Credential not configured",
  "provider.queryFailed": "Balance lookup failed",
  "provider.balanceBreakdown": "Granted {granted} · topped up {toppedUp}",
  "provider.empty": "No configured providers",
  "provider.loading": "Loading provider accounts",
  "provider.loadFailed": "Could not load provider accounts",
  "provider.selectHint": "Choose the account shown when collapsed",
  "provider.selectionUnsupported": "This provider does not support balance lookup",
  "provider.updatedAt": "Updated {time}",
  "action.refreshFailed": "Refresh failed",
  "billing.totalTokens": "Total tokens",
  "billing.totalCost": "Total cost",
  "billing.byModel": "By provider and model",
  "billing.modelsEmpty": "No provider or model usage yet",
  "billing.estimatedNotice": "Costs are local estimates based on public list prices and may differ from invoices because of price changes, tiers, discounts, regions, service modes, or incomplete event details.",
  "billing.daily": "Daily usage",
  "billing.weekdays": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
  "billing.months": "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",
  "billing.selectedDay": "Selected day",
  "billing.tokens": "Tokens",
  "billing.cost": "Cost",
  "billing.dayTokens": "{value} tokens",
  "billing.dayCost": "{value}",
  "billing.unpricedTokens": "{value} unpriced tokens",
  "billing.unpricedNotice": "Some usage could not be priced with current public metadata.",
  "billing.empty": "No billing data yet"
};
const t = (key) => labels[key] ?? key;
const heatmap = exports_.buildUsageHeatmap([
  { date: "2026-08-02", tokens: 100, costs: [{ currency: "USD", amount: 0.1 }], unpricedTokens: 0 },
  { date: "2026-08-21", tokens: 400, costs: [{ currency: "USD", amount: 0.4 }], unpricedTokens: 0 }
], "2026-08-21");
if (heatmap.length !== 27 || heatmap.some((week) => week.length !== 7)) throw new Error("heatmap must render the latest 27 complete weeks");
if (heatmap[0][0]?.date !== "2026-02-16") throw new Error("heatmap must start on Monday");
if (heatmap[26][4]?.date !== "2026-08-21" || heatmap[26][5]?.active !== false) throw new Error("heatmap must end on the selected date");
if (heatmap.flat().find((day) => day.date === "2026-08-21")?.level !== 4) throw new Error("heatmap intensity must scale to the busiest day");
const providerMarkup = renderToStaticMarkup(react.createElement(exports_.ProviderAccountsView, {
  providers: [
    {
      id: "deepseek-official",
      displayName: "DeepSeek",
      supported: true,
      configured: true,
      fetchedAt: Date.UTC(2026, 7, 21, 9, 30),
      balance: { remaining: 36.44, granted: 12.8, toppedUp: 49.24, currency: "CNY" }
    },
    { id: "openai-main", displayName: "OpenAI Main", supported: false, configured: true, balance: null },
    { id: "provider-3", displayName: "Provider 3", supported: false, configured: true, balance: null },
    { id: "provider-4", displayName: "Provider 4", supported: false, configured: true, balance: null },
    { id: "provider-5", displayName: "Provider 5", supported: false, configured: true, balance: null }
  ],
  selectedProviderId: "deepseek-official",
  onSelect: () => {},
  hidden: false,
  refreshFailed: true,
  t
}));
if (!providerMarkup.includes("DeepSeek") || !providerMarkup.includes("36.44")) throw new Error("provider list must show identity and balance");
if (!providerMarkup.includes("OpenAI Main") || !providerMarkup.includes("Balance lookup is not supported")) throw new Error("provider list must show unsupported configured providers");
if (!providerMarkup.includes("dul_accountList") || !source.includes("overflow-y:auto")) throw new Error("provider list must cap its height and scroll internally");
if (!providerMarkup.includes("Choose the account shown when collapsed")) throw new Error("provider selection purpose must be visible");
if (!providerMarkup.includes("type=\"radio\"") || !providerMarkup.includes("checked=\"\"") || !providerMarkup.includes("disabled=\"\"")) throw new Error("unsupported provider radios must remain visible but disabled");
if (!providerMarkup.includes("Refresh failed") || !providerMarkup.includes("Updated")) throw new Error("failed refresh must retain and identify the last successful fetch time");

const loadingProviderMarkup = renderToStaticMarkup(react.createElement(exports_.ProviderAccountsView, {
  providers: [],
  loading: true,
  hidden: false,
  t
}));
if (!loadingProviderMarkup.includes("Loading provider accounts") || loadingProviderMarkup.includes("No configured providers")) {
  throw new Error("initial provider loading must not look like an empty configuration");
}

const billingMarkup = renderToStaticMarkup(react.createElement(exports_.BillingView, {
  billing: {
    total: {
      tokens: 1234567,
      costs: [
        { currency: "CNY", amount: 0.18 },
        { currency: "USD", amount: 0.04 }
      ],
      unpricedTokens: 7654
    },
    providers: [{
      id: "deepseek",
      tokens: 1234567,
      costs: [{ currency: "USD", amount: 7.25 }],
      unpricedTokens: 0,
      models: [
        { id: "deepseek-chat", tokens: 1234567, costs: [{ currency: "USD", amount: 1.5 }], unpricedTokens: 0 },
        { id: "deepseek-free", tokens: 1200, costs: [{ currency: "USD", amount: 0 }], unpricedTokens: 0 },
        { id: "custom-gateway", tokens: 7654, costs: [], unpricedTokens: 7654 }
      ]
    }],
    days: [{
      date: "2026-08-21",
      tokens: 34567,
      costs: [{ currency: "USD", amount: 1.25 }],
      unpricedTokens: 100
    }]
  },
  t
}));
if (!billingMarkup.includes("1,234,567") || !billingMarkup.includes("2026-08-21")) throw new Error("billing view must show totals and daily rows");
if (!billingMarkup.includes("deepseek-chat") || !billingMarkup.includes("By provider and model")) throw new Error("billing view must show provider and model breakdown");
if (!billingMarkup.includes("0.18") || !billingMarkup.includes("$0.04") || !billingMarkup.includes(" + ")) {
  throw new Error("billing view must render mixed-currency totals without conversion");
}
if (!billingMarkup.includes("Some usage could not be priced") || !billingMarkup.includes("7,654 unpriced tokens")) {
  throw new Error("billing view must show an unpriced-token notice when pricing is incomplete");
}
if (!billingMarkup.includes("$0.00")) throw new Error("known zero-cost usage must render as zero in its own currency");
if (billingMarkup.includes("custom-gateway</span><span class=\"dul_modelValue\">7,654 tokens</span><span class=\"dul_modelValue\">$0.00</span>")) {
  throw new Error("unpriced usage must not render as free");
}
const providerUsageHeadStart = billingMarkup.indexOf('<div class="dul_providerUsageHead">');
const providerUsageHeadEnd = billingMarkup.indexOf("</div>", providerUsageHeadStart);
const providerUsageHeadMarkup = billingMarkup.slice(providerUsageHeadStart, providerUsageHeadEnd);
if (!providerUsageHeadMarkup.includes("$7.25")) throw new Error("provider summary must show its total cost");
const providerUsageHeadRule = /\.dul_providerUsageHead\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const modelRowRule = /\.dul_modelRow\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const providerColumns = /grid-template-columns:([^;]+)/.exec(providerUsageHeadRule)?.[1] ?? "";
const modelColumns = /grid-template-columns:([^;]+)/.exec(modelRowRule)?.[1] ?? "";
const providerTotalRule = /\.dul_providerUsageTotal\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const modelValueRule = /\.dul_modelValue\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
if (providerColumns === "" || providerColumns !== modelColumns) throw new Error("provider and model rows must share the same three-column layout");
if (!providerTotalRule.includes("text-align:right") || !modelValueRule.includes("text-align:right")) throw new Error("usage values must align to the right edge of their columns");
if (injectedStyleText.includes(".dul_modelValue:last-child{grid-column:2}")) throw new Error("responsive layout must keep model cost in the third column");
if (!billingMarkup.includes("Costs are local estimates based on public list prices")) throw new Error("billing view must disclose estimated costs");
if (!billingMarkup.includes("dul_heatmap") || !billingMarkup.includes("Mon") || !billingMarkup.includes("2026-08-21")) throw new Error("billing view must render a compact usage heatmap");
if (!source.includes("grid-template-columns:repeat(27,minmax(0,1fr))")) throw new Error("heatmap weeks must fill the available row width");
const viewportRule = /\.dul_heatmapViewport\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const selectedRule = /\.dul_heatmapDay\[data-selected=true\]\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const selectedRing = Math.max(0, ...Array.from(selectedRule.matchAll(/0 0 0 (\d+)px/g), (match) => Number(match[1])));
const viewportPadding = Number(/(?:^|;)padding:(\d+)px(?:;|$)/.exec(viewportRule)?.[1] ?? 0);
const viewportMargin = Number(/(?:^|;)margin:-(\d+)px(?:;|$)/.exec(viewportRule)?.[1] ?? 0);
if (selectedRing === 0 || viewportPadding < selectedRing || viewportMargin < selectedRing) {
  throw new Error("heatmap viewport must reserve and offset enough room for the selected-day ring");
}

const emptyBreakdownMarkup = renderToStaticMarkup(react.createElement(exports_.BillingView, {
  billing: { total: { tokens: 0, costs: [], unpricedTokens: 0 }, providers: [], days: [] },
  t
}));
if (!emptyBreakdownMarkup.includes("By provider and model") || !emptyBreakdownMarkup.includes("No provider or model usage yet")) {
  throw new Error("provider and model section must remain visible when usage data is empty");
}

const markup = renderToStaticMarkup(react.createElement(exports_.UsageLitePanel, {
  wide: true,
  t: (key) => key
}));
if (!markup.includes("panel.title") || markup.includes("panel.badge")) throw new Error("collapsed and expanded titles must match");
if (!markup.includes("dul_badgeTop") || !markup.includes("dul_badgeMeta")) throw new Error("collapsed summary must use the compact two-line layout");
if (!markup.includes("action.refresh")) throw new Error("refresh button missing");
if (!markup.includes("provider.loading") || !markup.includes("disabled=\"\"") || !markup.includes("data-loading=\"true\"")) {
  throw new Error("initial summary must expose a loading state and disable duplicate refreshes");
}

let stateIndex = 0;
const expandedReact = {
  ...react,
  useState: (initial) => {
    const value = stateIndex++ === 0 ? true : typeof initial === "function" ? initial() : initial;
    return [value, () => {}];
  },
  useCallback: (callback) => callback,
  useEffect: () => {},
  useRef: () => ({ current: null })
};
const expandedExports = captured.factory((spec) => {
  if (spec === "react") return expandedReact;
  if (spec === "react/jsx-runtime") return jsxRuntime;
  if (spec === "react-dom") return { createPortal: (node) => node };
  if (spec === "@deepseek-ai/dsh-client-ui-primitives") return primitives;
  throw new Error(`unexpected require: ${spec}`);
});
const expandedMarkup = renderToStaticMarkup(react.createElement(expandedExports.UsageLitePanel, {
  wide: true,
  t: (key) => key
}));
if (!expandedMarkup.includes("panel.title") || expandedMarkup.includes("panel.detailSubtitle")) {
  throw new Error("expanded header must not render a redundant subtitle");
}

const registrations = [];
exports_.apply({
  effect: () => {},
  locale: { register: (ns, dict) => { if (ns !== "usageLite") throw new Error(`unexpected locale namespace ${ns}`); if (!dict.zh || !dict.en) throw new Error("missing dictionaries"); } },
  slots: {
    inject: (slot, fn) => { registrations.push([slot, fn]); return () => {}; },
    register: () => () => {}
  }
});
if (registrations.length !== 1) throw new Error("expected one slot registration");
if (registrations[0][0] !== "sidebar.footer.action") throw new Error("unexpected slot");

console.log("client ok");
