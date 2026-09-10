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
  previousDetail: { providers: [{ id: "deepseek-official", displayName: "DeepSeek" }], billing: { total: { tokens: 0, cost: 0 }, days: [] } }
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
      billing: { total: { tokens: 0, cost: 0 }, providers: [], days: [] }
    }
  },
  previousDetail: {
    providers: [{ id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, fetchedAt: 1234, balance: { remaining: 8.8, currency: "CNY" } }],
    provider: { id: "deepseek-official", fetchedAt: 1234, balance: { remaining: 8.8, currency: "CNY" } },
    billing: { total: { tokens: 0, cost: 0 }, providers: [], days: [] }
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
  "billing.estimatedNotice": "Costs are estimates and may differ from provider billing.",
  "billing.daily": "Daily usage",
  "billing.weekdays": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
  "billing.months": "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",
  "billing.selectedDay": "Selected day",
  "billing.tokens": "Tokens",
  "billing.cost": "Cost",
  "billing.dayTokens": "{value} tokens",
  "billing.dayCost": "{value}",
  "billing.empty": "No billing data yet",
  "billing.trend7d": "Last 7 days",
  "billing.overview": "Token usage",
  "billing.trends": "Usage trends",
  "billing.pickDay": "Pick a day to see its models",
  "billing.dayEmpty": "No usage on this day",
  "billing.tokens7d": "7-day tokens",
  "billing.dailyAverage": "Daily average",
  "billing.deltaNone": "No baseline",
  "billing.deltaHint": "Change versus the previous 7 days",
  "billing.otherModels": "{count} other models",
  "provider.noSupportedBalance": "No providers support balance lookup",
  "provider.account": "Provider accounts",
  "action.refreshing": "Refreshing"
};
const t = (key) => labels[key] ?? key;
const heatmap = exports_.buildUsageHeatmap([
  { date: "2026-08-02", tokens: 100, cost: 0.1 },
  { date: "2026-08-21", tokens: 400, cost: 0.4 }
], "2026-08-21");
if (heatmap.length !== 27 || heatmap.some((week) => week.length !== 7)) throw new Error("heatmap must render the latest 27 complete weeks");
if (heatmap[0][0]?.date !== "2026-02-16") throw new Error("heatmap must start on Monday");
if (heatmap[26][4]?.date !== "2026-08-21" || heatmap[26][5]?.active !== false) throw new Error("heatmap must end on the selected date");
if (heatmap.flat().find((day) => day.date === "2026-08-21")?.level !== 4) throw new Error("heatmap intensity must scale to the busiest day");

if (typeof exports_.buildDailyTrend !== "function") throw new Error("missing daily trend helper");
if (typeof exports_.UsageTrendChart !== "function") throw new Error("missing usage trend chart component");
if (typeof exports_.BalanceColumn !== "function") throw new Error("missing balance column component");
if (typeof exports_.fmtCompact !== "function") throw new Error("missing compact number helper");

if (exports_.fmtCompact(2488124) !== "2.5M") throw new Error(`compact millions formatting wrong: ${exports_.fmtCompact(2488124)}`);
if (exports_.fmtCompact(34567) !== "35K") throw new Error(`compact thousands formatting wrong: ${exports_.fmtCompact(34567)}`);
if (exports_.fmtCompact(1500) !== "1.5K") throw new Error(`compact low-thousands formatting wrong: ${exports_.fmtCompact(1500)}`);
if (exports_.fmtCompact(842) !== "842") throw new Error("compact formatting must leave small numbers intact");
if (exports_.fmtCompact(Number.NaN) !== "0") throw new Error("compact formatting must tolerate non-finite input");

// 7-day window ending 2026-08-21 covers 08-15..08-21; the prior window is 08-08..08-14.
const modelDay = (date, pairs) => ({
  date,
  tokens: pairs.reduce((sum, [, tokens]) => sum + tokens, 0),
  cost: pairs.reduce((sum, [, tokens]) => sum + tokens, 0) / 1000,
  providers: [{ id: "ais", tokens: pairs.reduce((sum, [, tokens]) => sum + tokens, 0), models: pairs.map(([id, tokens]) => ({ id, tokens, cost: tokens / 1000 })) }]
});
const trend = exports_.buildDailyTrend([
  modelDay("2026-08-10", [["alpha", 100]]),
  modelDay("2026-08-15", [["alpha", 150], ["beta", 50]]),
  modelDay("2026-08-21", [["alpha", 300], ["beta", 100]])
], "2026-08-21");
if (trend.bars.length !== 7) throw new Error("trend must expose exactly seven bars");
if (trend.bars[0].date !== "2026-08-15" || trend.bars[6].date !== "2026-08-21") throw new Error("trend window must end on the latest day");
if (trend.total !== 600) throw new Error(`trend total must sum the window only, got ${trend.total}`);
if (trend.max !== 400) throw new Error("trend max must be the busiest day in the window");
if (Math.abs(trend.average - 600 / 7) > 1e-9) throw new Error("trend average must divide by the full span");
// Previous window held only 08-10 (100 tokens), so 600 vs 100 is +500%.
if (Math.round(trend.delta * 100) !== 500) throw new Error(`trend delta must compare against the previous window, got ${trend.delta}`);
if (trend.bars[6].ratio !== 1) throw new Error("busiest bar must have a full ratio");
if (trend.bars[1].tokens !== 0 || trend.bars[1].ratio !== 0) throw new Error("days without usage must stay in the window as zero bars");
if (trend.bars[0].weekday !== 5) throw new Error("2026-08-15 is a Saturday, so weekday index must be 5");

// Per-model stacking: series ranks by window total so slot colors stay stable.
if (trend.series.map((entry) => entry.id).join(",") !== "alpha,beta") {
  throw new Error(`series must rank models by window total, got ${trend.series.map((e) => e.id).join(",")}`);
}
if (trend.series[0].tokens !== 450 || trend.series[1].tokens !== 150) throw new Error("series totals must aggregate across the window");
if (trend.series[0].slot !== 0 || trend.series[1].slot !== 1) throw new Error("series slots must be assigned by rank");
const lastSegments = trend.bars[6].segments;
if (lastSegments.length !== 2) throw new Error("a day using two models must stack two segments");
if (lastSegments[0].id !== "alpha" || lastSegments[0].slot !== 0) throw new Error("segments must carry their series slot");
if (Math.abs(lastSegments[0].share - 0.75) > 1e-9 || Math.abs(lastSegments[1].share - 0.25) > 1e-9) {
  throw new Error("segment shares must divide the day's own stack, not the window max");
}
if (Math.abs(lastSegments.reduce((sum, s) => sum + s.share, 0) - 1) > 1e-9) {
  throw new Error("segment shares must fill the bar exactly");
}
if (trend.bars[1].segments.length !== 0) throw new Error("a day without usage must have no segments");
// Slots are capped: extra models collapse into one aggregated bucket.
const manyModels = exports_.buildDailyTrend([
  modelDay("2026-08-21", [["m1", 700], ["m2", 600], ["m3", 500], ["m4", 400], ["m5", 300], ["m6", 200], ["m7", 100]])
], "2026-08-21");
if (manyModels.series.length !== 6) throw new Error(`series must cap at five named models plus one bucket, got ${manyModels.series.length}`);
const bucket = manyModels.series[5];
if (bucket.other !== true || bucket.id !== "__other__") throw new Error("the overflow bucket must be flagged");
if (bucket.tokens !== 300 || bucket.count !== 2) throw new Error(`the bucket must sum every overflow model, got ${bucket.tokens}/${bucket.count}`);
if (manyModels.bars[6].segments.length !== 6) throw new Error("overflow models must collapse into a single stacked segment");
if (manyModels.bars[6].segments[5].slot !== 5) throw new Error("the overflow segment must use the reserved slot");
// A day whose totals carry no model breakdown must still render as one bar.
const noModels = exports_.buildDailyTrend([{ date: "2026-08-21", tokens: 400, cost: 0.4 }], "2026-08-21");
if (noModels.bars[6].tokens !== 400) throw new Error("a day without a model breakdown must keep its total");
if (noModels.bars[6].segments.length !== 0 || noModels.series.length !== 0) throw new Error("no model data must yield no segments rather than a fake one");

const noBaselineTrend = exports_.buildDailyTrend([{ date: "2026-08-21", tokens: 400, cost: 0.4 }], "2026-08-21");
if (noBaselineTrend.delta !== null) throw new Error("a zero previous window must yield no delta instead of Infinity");
const emptyTrend = exports_.buildDailyTrend([], "");
if (emptyTrend.bars.length !== 0 || emptyTrend.delta !== null) throw new Error("an invalid end date must degrade to an empty trend");

const trendMarkup = renderToStaticMarkup(react.createElement(exports_.UsageTrendChart, {
  trend,
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  selectedDate: "2026-08-21",
  onSelect: () => {},
  t
}));
if (!trendMarkup.includes("Last 7 days")) throw new Error("trend chart must render its title");
if (!trendMarkup.includes("dul_barStack")) throw new Error("trend chart must render bars");
if ((trendMarkup.match(/dul_barCol/g) ?? []).length !== 7) throw new Error("trend chart must render one column per day");
// Stacked segments must be color-coded per model and explained by a legend.
// Two model-bearing days (08-15 and 08-21) each stack alpha + beta.
if ((trendMarkup.match(/dul_barSeg/g) ?? []).length !== 4) {
  throw new Error("two model-bearing days must contribute four stacked segments in total");
}
if (!trendMarkup.includes('data-slot="0"') || !trendMarkup.includes('data-slot="1"')) {
  throw new Error("stacked segments must carry distinct series slots");
}
if (!trendMarkup.includes("dul_legend") || !trendMarkup.includes("dul_legendSwatch")) {
  throw new Error("the chart must explain its colors with a legend");
}
if (!trendMarkup.includes("alpha") || !trendMarkup.includes("beta")) throw new Error("legend must name each model series");
// A grid gap between columns is dead click area: a click there selects no day, so the
// detail block below keeps showing the previous day. Spacing must come from the
// columns' own padding instead, keeping the whole plot width clickable.
const barsGapRule = /\.dul_bars\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const barsGap = /(?:^|;)gap:([^;]+)/.exec(barsGapRule)?.[1]?.trim() ?? "";
if (barsGap !== "0") throw new Error("bar chart columns must not be separated by a dead grid gap");
const barColRule = /\.dul_barCol\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const barColPadding = /(?:^|;)padding:([^;]+)/.exec(barColRule)?.[1]?.trim() ?? "";
// padding: <top> <side> <bottom>. The sides keep the visual spacing that replaced the
// grid gap; the top is headroom. Without it a ratio-1 bar reaches the column's exact
// top edge and the selected ring (drawn 3px OUTSIDE the stack) spills past the
// hover/selected tint, so the tallest day looked like it burst out of its blue box.
const barColPad = /^([\d.]+)px ([\d.]+)px 0$/.exec(barColPadding);
if (barColPad === null) {
  throw new Error("bar column padding must be '<top>px <side>px 0'");
}
if (Number(barColPad[2]) <= 0) {
  throw new Error("bar columns must carry their own horizontal padding for visual spacing");
}
const SELECTED_RING_PX = 3;
if (Number(barColPad[1]) < SELECTED_RING_PX) {
  throw new Error("bar columns need top headroom so a full-height bar's selected ring stays inside the tint");
}
// The responsive override must not drop that headroom back to zero.
for (const [, mediaBody] of injectedStyleText.matchAll(/@media[^{]*\{((?:[^{}]|\{[^}]*\})*)\}/g)) {
  // Extract the rule body first, so the padding anchor can match at its start.
  const responsiveRule = /\.dul_barCol\{([^}]*)\}/.exec(mediaBody)?.[1];
  if (responsiveRule === undefined) continue;
  const responsivePad = /(?:^|;)padding:([^;]+)/.exec(responsiveRule)?.[1]?.trim();
  if (responsivePad === undefined) continue;
  const parsed = /^([\d.]+)px ([\d.]+)px 0$/.exec(responsivePad);
  if (parsed === null || Number(parsed[1]) < SELECTED_RING_PX || Number(parsed[2]) <= 0) {
    throw new Error("responsive bar column padding must keep both side spacing and top headroom");
  }
}
if (/@media[^{]*\{[^@]*\.dul_bars\{[^}]*gap:(?!0)/.test(injectedStyleText)) {
  throw new Error("responsive layout must not reintroduce a dead gap between bar columns");
}
// A zero-usage day renders as a hairline, so selection must also tint the column.
if (!/\.dul_barCol\[data-selected=true\]\{[^}]*background:/.test(injectedStyleText)) {
  throw new Error("a selected column must be visible even when its bar is a hairline");
}
const manyMarkup = renderToStaticMarkup(react.createElement(exports_.UsageTrendChart, {
  trend: manyModels,
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  selectedDate: "2026-08-21",
  t
}));
if (!manyMarkup.includes("2 other models")) throw new Error("the overflow bucket must be labelled and counted in the legend");
if (!manyMarkup.includes('data-slot="5"')) throw new Error("the overflow bucket must use the reserved slot color");

// The strip under the bars must be scoped to the CLICKED day, not the 7-day window.
// A window can contain exactly one active day (real data does), and then a
// window-scoped strip shows numbers identical to that day no matter which bar is
// picked -- it looks frozen on "today". Assert against the strip's own container so
// bar tooltips, which repeat the same names, cannot satisfy these checks.
const stripOf = (markup) => {
  const start = markup.indexOf('<div class="dul_dayLegend">');
  return start < 0 ? "" : markup.slice(start);
};
// trend fixture: 08-15 and 08-21 carry alpha+beta; 08-16..08-20 are zero days.
const stripToday = stripOf(trendMarkup);
if (stripToday === "") throw new Error("the chart must render a day-scoped strip under the bars");
if (!stripToday.includes("2026-08-21")) throw new Error("the strip must name the selected day");
if (!stripToday.includes("alpha") || !stripToday.includes("beta")) {
  throw new Error("the strip must break the selected day into its models");
}
// Names alone cannot tell the two scopes apart -- both hold alpha and beta. Only the
// VALUES can: day 08-21 is alpha 300 / beta 100, while the window sums alpha 450 /
// beta 150. Assert the day numbers are present and the window sums are absent.
if (!stripToday.includes("300 \u00b7 75%") || !stripToday.includes("100 \u00b7 25%")) {
  throw new Error("the strip must show the selected day's own token counts and shares");
}
if (stripToday.includes("450") || stripToday.includes("150 \u00b7")) {
  throw new Error("the strip must not fall back to window-wide totals");
}
if (stripToday.includes("NaN")) throw new Error("the strip must not render NaN shares");
// The strip's headline total must be the DAY's, not the window's. In the 7-day
// fixture both happen to be 600, so assert on a day whose total is unambiguous:
// 08-15 is 200 while the window is 600.
const midDayMarkup = renderToStaticMarkup(react.createElement(exports_.UsageTrendChart, {
  trend,
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  selectedDate: "2026-08-15",
  onSelect: () => {},
  t
}));
const stripMid = stripOf(midDayMarkup);
if (!stripMid.includes("200 tokens")) throw new Error("the strip total must be the selected day's own total");
if (stripMid.includes("600 tokens")) throw new Error("the strip total must not show the 7-day window total");
// Same for cost: day 08-15 is 0.20 while the window is 0.60.
if (!stripMid.includes("0.20")) throw new Error("the strip cost must be the selected day's own cost");
if (stripMid.includes("0.60")) throw new Error("the strip cost must not show the 7-day window cost");
const zeroDayMarkup = renderToStaticMarkup(react.createElement(exports_.UsageTrendChart, {
  trend,
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  selectedDate: "2026-08-19",
  onSelect: () => {},
  t
}));
const stripZero = stripOf(zeroDayMarkup);
if (!stripZero.includes("2026-08-19")) throw new Error("the strip must follow a click onto a zero-usage day");
if (!stripZero.includes("No usage on this day")) throw new Error("a zero-usage day must say so instead of showing stale models");
if (stripZero.includes("alpha") || stripZero.includes("beta")) {
  throw new Error("a zero-usage day must not keep the previous day's model rows");
}
// The proof that the strip is not window-scoped: two different days must differ.
if (stripZero === stripToday) throw new Error("the strip must change between two different selected days");
// The palette must be defined for every slot, including a dark-theme variant.
for (const slot of [0, 1, 2, 3, 4]) {
  if (!injectedStyleText.includes(`--dul-series-${slot}:`)) throw new Error(`series color ${slot} is undefined`);
}
if (!injectedStyleText.includes("--dul-series-other:")) throw new Error("the overflow series color is undefined");
if (!/\[data-ds-dark-theme\][^{]*\.dul_panel\{[^}]*--dul-series-0:/.test(injectedStyleText)) {
  throw new Error("the palette must be retuned for the dark theme");
}
const seriesColors = [0, 1, 2, 3, 4, "other"].map((slot) => /:\s*(#[0-9a-f]{3,8})/i.exec(
  new RegExp(`--dul-series-${slot}(:[^;}]*)`).exec(injectedStyleText)?.[1] ?? ""
)?.[1]?.toLowerCase());
if (new Set(seriesColors).size !== seriesColors.length) {
  throw new Error(`series colors must all differ, got ${seriesColors.join(",")}`);
}
if (!trendMarkup.includes('data-dir="up"') || !trendMarkup.includes("+500%")) throw new Error("trend chart must show a signed period-over-period delta");
if (!trendMarkup.includes('data-selected="true"')) throw new Error("trend chart must mark the selected day");
if (!trendMarkup.includes('data-zero="true"')) throw new Error("zero-usage days must be visually distinguishable");
const emptyTrendMarkup = renderToStaticMarkup(react.createElement(exports_.UsageTrendChart, {
  trend: exports_.buildDailyTrend([], "2026-08-21"),
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  t
}));
if (!emptyTrendMarkup.includes("No billing data yet") || emptyTrendMarkup.includes("dul_barStack")) {
  throw new Error("a fully empty window must show the empty state instead of flat bars");
}
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

// The balance hero must never contradict the account list beneath it.
const heroCase = (props) => renderToStaticMarkup(react.createElement(exports_.BalanceColumn, {
  provider: null,
  selectedProviderId: void 0,
  onSelect: () => {},
  hidden: false,
  loading: false,
  loadFailed: false,
  refreshing: false,
  refreshFailed: false,
  t,
  ...props
}));
const unsupportedRows = [
  { id: "ais", displayName: "AIS Gateway", supported: false, configured: true, balance: null },
  { id: "custom-gw", displayName: "Custom Gateway", supported: false, configured: true, balance: null }
];

const heroNoProviders = heroCase({ providers: [] });
if (!heroNoProviders.includes("No configured providers")) throw new Error("an empty configuration must say so in the hero");

const heroUnsupported = heroCase({ providers: unsupportedRows });
if (!heroUnsupported.includes("No providers support balance lookup")) {
  throw new Error("configured-but-unsupported providers must not be reported as unconfigured");
}
if (heroUnsupported.includes("No configured providers")) {
  throw new Error("the hero must not claim an empty configuration while the list shows providers");
}

const heroLoading = heroCase({ providers: [], loading: true });
if (!heroLoading.includes("Loading provider accounts") || heroLoading.includes("No configured providers")) {
  throw new Error("initial hero load must not look like an empty configuration");
}

const heroFailed = heroCase({ providers: [], loadFailed: true, refreshFailed: true });
if (!heroFailed.includes("Could not load provider accounts") || heroFailed.includes("No configured providers")) {
  throw new Error("a failed load must not be reported as an empty configuration");
}
if (!heroFailed.includes('data-state="error"')) throw new Error("a failed hero load must carry the error state");

// A real balance must still render its value and breakdown.
const heroOk = heroCase({
  provider: { id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, fetchedAt: Date.UTC(2026, 7, 21, 9, 30), balance: { remaining: 19.39, granted: 0, toppedUp: 19.39, currency: "CNY" } },
  providers: [{ id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, balance: { remaining: 19.39, granted: 0, toppedUp: 19.39, currency: "CNY" } }]
});
if (!heroOk.includes("19.39") || !heroOk.includes("dul_heroSplit")) throw new Error("a supported provider must show its balance and breakdown");
if (heroOk.includes("No configured providers") || heroOk.includes("No providers support balance lookup")) {
  throw new Error("a healthy balance must not render any empty-state copy");
}
const heroHidden = heroCase({
  provider: { id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, balance: { remaining: 19.39, granted: 0, toppedUp: 19.39, currency: "CNY" } },
  providers: [{ id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true, balance: { remaining: 19.39, granted: 0, toppedUp: 19.39, currency: "CNY" } }],
  hidden: true
});
if (heroHidden.includes("19.39") || !heroHidden.includes("••••")) throw new Error("hidden mode must mask the hero balance and its breakdown");

const billingMarkup = renderToStaticMarkup(react.createElement(exports_.BillingView, {
  billing: {
    total: { tokens: 1234567, cost: 18.5 },
    providers: [{
      id: "deepseek",
      tokens: 1234567,
      cost: 7.25,
      models: [{ id: "deepseek-chat", tokens: 1234567, cost: 1.5 }]
    }],
    days: [{ date: "2026-08-21", tokens: 34567, cost: 1.25 }]
  },
  t
}));
if (!billingMarkup.includes("1,234,567") || !billingMarkup.includes("2026-08-21")) throw new Error("billing view must show totals and daily rows");
if (!billingMarkup.includes("deepseek-chat") || !billingMarkup.includes("By provider and model")) throw new Error("billing view must show provider and model breakdown");
const providerUsageHeadStart = billingMarkup.indexOf('<div class="dul_providerUsageHead">');
const providerUsageHeadEnd = billingMarkup.indexOf("</div>", providerUsageHeadStart);
const providerUsageHeadMarkup = billingMarkup.slice(providerUsageHeadStart, providerUsageHeadEnd);
if (!providerUsageHeadMarkup.includes("7.25")) throw new Error("provider summary must show its total cost");
const providerUsageHeadRule = /\.dul_providerUsageHead\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const modelRowRule = /\.dul_modelRow\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const providerColumns = /grid-template-columns:([^;]+)/.exec(providerUsageHeadRule)?.[1] ?? "";
const modelColumns = /grid-template-columns:([^;]+)/.exec(modelRowRule)?.[1] ?? "";
const providerTotalRule = /\.dul_providerUsageTotal\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const modelValueRule = /\.dul_modelValue\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
if (providerColumns === "" || providerColumns !== modelColumns) throw new Error("provider and model rows must share the same three-column layout");
if (!providerTotalRule.includes("text-align:right") || !modelValueRule.includes("text-align:right")) throw new Error("usage values must align to the right edge of their columns");
if (injectedStyleText.includes(".dul_modelValue:last-child{grid-column:2}")) throw new Error("responsive layout must keep model cost in the third column");
if (billingMarkup.includes("Costs are estimates")) throw new Error("the estimate disclosure now belongs to the header, not the usage column");
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
// The weekday gutter used to push the grid right while the right edge kept only the
// card padding, so the heatmap looked lopsided, and a fixed-width gutter left a dead
// pocket between the labels and the first column. One grid must own both rows.
const heatmapCanvasRule = /\.dul_heatmapCanvas\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
if (!heatmapCanvasRule.includes("grid-template-columns:max-content minmax(0,1fr)")) {
  throw new Error("heatmap gutter must hug its weekday text instead of a fixed width");
}
if (injectedStyleText.includes(".dul_heatmapBody{") || source.includes("dul_heatmapBody")) {
  throw new Error("months and weeks must share one grid, not a separate body wrapper");
}
for (const [name, area] of [["dul_heatmapMonths", "1/2"], ["dul_heatmapWeekdays", "2/1"], ["dul_heatmapWeeks", "2/2"]]) {
  const rule = new RegExp(`\\.${name}\\{([^}]*)\\}`).exec(injectedStyleText)?.[1] ?? "";
  if (!rule.includes(`grid-area:${area}`)) {
    throw new Error(`${name} must be placed in the shared heatmap grid at ${area}`);
  }
}
if (/\.dul_heatmapMonths\{[^}]*margin-left:\d+px/.test(injectedStyleText)) {
  throw new Error("month label offset must derive from the shared grid, not a hard-coded margin");
}

// Layout order: overall usage (totals + per-provider) on top, time-series below.
const sectionOrder = ["billing.overview", "billing.byModel", "billing.trends", "billing.daily"]
  .map((key) => ({ key, at: billingMarkup.indexOf(t(key)) }));
for (const section of sectionOrder) {
  if (section.at < 0) throw new Error(`billing view must render the ${section.key} section`);
}
for (let i = 1; i < sectionOrder.length; i += 1) {
  if (sectionOrder[i].at < sectionOrder[i - 1].at) {
    throw new Error(`${sectionOrder[i].key} must render after ${sectionOrder[i - 1].key}`);
  }
}
// The bar chart belongs to the lower trend half, after the provider breakdown.
if (billingMarkup.indexOf("dul_chartCard") < billingMarkup.indexOf("dul_providerUsage")) {
  throw new Error("the trend chart must sit below the provider and model breakdown");
}
if (billingMarkup.indexOf("dul_chartCard") > billingMarkup.indexOf("dul_heatmap")) {
  throw new Error("the trend bar chart must precede the heatmap in the trend half");
}

const emptyBreakdownMarkup = renderToStaticMarkup(react.createElement(exports_.BillingView, {
  billing: { total: { tokens: 0, cost: 0 }, providers: [], days: [] },
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
// The two tabs were merged into one wide two-column body; tabs must not come back.
if (expandedMarkup.includes("dul_tabs") || expandedMarkup.includes("tab.provider") || expandedMarkup.includes("tab.billing")) {
  throw new Error("panel must not render the retired tab switcher");
}
if (!expandedMarkup.includes("dul_columns") || !expandedMarkup.includes("dul_colLeft") || !expandedMarkup.includes("dul_colRight")) {
  throw new Error("panel must render the merged two-column layout");
}
// Balance (left) and usage (right) must both be present at once, with no tab switch.
if (!expandedMarkup.includes("dul_hero") || !expandedMarkup.includes("provider.account")) {
  throw new Error("left column must show the balance hero and provider accounts together");
}
if (!expandedMarkup.includes("dul_chartCard") || !expandedMarkup.includes("dul_overview")) {
  throw new Error("right column must show KPIs and the trend chart together");
}
const columnsRule = /\.dul_columns\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const leftRail = Number(/grid-template-columns:\s*(\d+)px\s+minmax\(0,1fr\)/.exec(columnsRule)?.[1] ?? 0);
if (leftRail === 0) throw new Error("two-column layout must pin a fixed left rail and a fluid right column");
// Narrow enough to leave the usage column room, wide enough for the balance card.
if (leftRail < 280 || leftRail > 340) throw new Error(`left rail width ${leftRail}px is outside the usable range`);
if (!/@media\(max-width:840px\)/.test(injectedStyleText) || !injectedStyleText.includes(".dul_columns{grid-template-columns:minmax(0,1fr)}")) {
  throw new Error("wide layout must collapse to a single column on narrow viewports");
}
// The header is one compact inline row: title and subtitle share a baseline.
const headTextRule = /\.dul_headText\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
if (headTextRule.includes("flex-direction:column") || !headTextRule.includes("align-items:baseline")) {
  throw new Error("header title and subtitle must sit inline on one row, not stacked");
}
const headRule = /\.dul_head\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
const headMinHeight = Number(/min-height:(\d+)px/.exec(headRule)?.[1] ?? 0);
if (headMinHeight < 48 || headMinHeight > 60) throw new Error(`header height ${headMinHeight}px is outside the intended range`);
// box-sizing does not inherit from .dul_panel, so min-height silently gained padding+border.
if (!headRule.includes("box-sizing:border-box")) {
  throw new Error("header must set border-box or its min-height inflates by padding and border");
}
// The estimate disclosure moved into the header, filling its former dead space.
if (!expandedMarkup.includes("dul_headNotice") || !expandedMarkup.includes("billing.estimatedNotice")) {
  throw new Error("header must carry the estimate disclosure in its free space");
}
if (expandedMarkup.includes("dul_estimateNotice")) throw new Error("the retired estimate-notice row must be gone");
const headNoticeRule = /\.dul_headNotice\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
if (!headNoticeRule.includes("flex:1") || !headNoticeRule.includes("text-align:right") || !headNoticeRule.includes("text-overflow:ellipsis")) {
  throw new Error("header notice must absorb the free space, align right, and truncate safely");
}
const barsRule = /\.dul_bars\{([^}]*)\}/.exec(injectedStyleText)?.[1] ?? "";
if (!/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/.test(barsRule) || !barsRule.includes("align-items:end")) {
  throw new Error("trend chart must lay out seven equal bottom-aligned columns");
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
