window.__ModuleLoader__.load({
  id: "dsh-usage-lite",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    let react = require("react");
    let react_jsx_runtime = require("react/jsx-runtime");
    let react_dom = require("react-dom");
    let primitives = require("@deepseek-ai/dsh-client-ui-primitives");

    const css = [
      ".dul_wrap{width:100%;margin:8px 0 0}",
      ".dul_badgeShell{box-sizing:border-box;width:100%;min-height:58px;border:1px solid transparent;border-radius:13px;display:flex;align-items:center;gap:3px;padding:4px;color:var(--dsw-alias-label-primary);transition:background .18s ease,border-color .18s ease}",
      ".dul_badgeShell:hover,.dul_badgeShell[data-open=true]{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l1)}",
      ".dul_badgeMain{min-width:0;flex:1;border:0;background:transparent;color:inherit;border-radius:9px;padding:5px 3px;display:flex;align-items:center;gap:8px;text-align:left;cursor:pointer;font:inherit}",
      ".dul_badgeGlyph{width:32px;height:32px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:#2563eb;background:color-mix(in srgb,#2563eb 11%,var(--dsw-alias-bg-base));box-shadow:inset 0 0 0 1px color-mix(in srgb,#2563eb 14%,transparent)}",
      ".dul_badgeContent{min-width:0;display:flex;flex:1;flex-direction:column;gap:1px}",
      ".dul_badgeTop,.dul_badgeMeta{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:8px}",
      ".dul_title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:680;line-height:16px;letter-spacing:.005em}",
      ".dul_amount{flex:none;font-size:11px;font-weight:720;line-height:16px;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".dul_badgeProvider{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:560;line-height:14px;color:var(--dsw-alias-label-secondary)}",
      ".dul_badgeUpdated{flex:none;font-size:8px;line-height:14px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
      ".dul_actions{display:flex;align-items:center;gap:1px;flex:none}",
      ".dul_icon{width:24px;height:24px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:color .16s ease,background .16s ease,transform .16s ease}",
      ".dul_icon:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-fill-l2);transform:translateY(-1px)}",
      ".dul_icon:disabled,.dul_close:disabled{cursor:default;opacity:.62;transform:none}",
      ".dul_icon[data-loading=true] svg,.dul_close[data-loading=true] svg{animation:dul_spin .72s linear infinite}",
      "@keyframes dul_spin{to{transform:rotate(360deg)}}",
      ".dul_wrap[data-wide=false]{width:36px;margin:0}",
      ".dul_wrap[data-wide=false] .dul_badgeShell{width:36px;height:36px;min-height:36px;padding:0;border-radius:12px}",
      ".dul_wrap[data-wide=false] .dul_badgeMain{width:36px;height:36px;padding:3px;justify-content:center}",
      ".dul_wrap[data-wide=false] .dul_badgeGlyph{width:30px;height:30px}",
      ".dul_wrap[data-wide=false] .dul_badgeContent,.dul_wrap[data-wide=false] .dul_actions{display:none}",
      ".dul_panel{--dul-accent:#2563eb;box-sizing:border-box;position:fixed;left:12px;bottom:128px;z-index:100;width:520px;max-width:calc(100vw - 24px);max-height:min(78vh,680px);background:color-mix(in srgb,var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-base)) 96%,#eef4ff);border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 78%,#b8ccff);border-radius:20px;box-shadow:0 24px 64px rgba(30,64,175,.14),0 6px 20px rgba(15,23,42,.08);display:flex;flex-direction:column;overflow:hidden;animation:dul_enter .2s cubic-bezier(.2,.8,.2,1)}",
      "@keyframes dul_enter{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}",
      ".dul_head{min-height:58px;padding:10px 12px 10px 16px;border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:space-between;gap:12px;background:color-mix(in srgb,var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-base)) 92%,transparent)}",
      ".dul_headIdentity{min-width:0;display:flex;align-items:center;gap:10px}",
      ".dul_headGlyph{width:30px;height:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;color:var(--dul-accent);background:color-mix(in srgb,var(--dul-accent) 10%,transparent)}",
      ".dul_headText{min-width:0;display:flex;flex-direction:column;gap:1px}",
      ".dul_headTitle{font-size:14px;font-weight:680;line-height:20px;letter-spacing:.005em}",
      ".dul_headActions{display:flex;align-items:center;gap:2px}",
      ".dul_close{width:30px;height:30px;border:0;border-radius:9px;background:transparent;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}",
      ".dul_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".dul_body{padding:15px 16px 17px;display:flex;flex-direction:column;gap:14px;overflow:auto;overscroll-behavior:contain}",
      ".dul_sectionLabel{display:block;margin:0 0 6px;font-size:10px;font-weight:600;line-height:15px;color:var(--dsw-alias-label-tertiary);letter-spacing:.02em}",
      ".dul_tabs{align-self:flex-start;padding:3px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-fill-l1);display:flex;gap:2px}",
      ".dul_tab{min-width:96px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);padding:6px 12px;font:inherit;font-size:11px;font-weight:550;line-height:17px;cursor:pointer;transition:background .16s ease,color .16s ease,box-shadow .16s ease}",
      ".dul_tab[data-on=true]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-weight:650;box-shadow:0 1px 3px rgba(15,23,42,.08)}",
      ".dul_view{display:flex;flex-direction:column;gap:12px}",
      ".dul_accountList{box-sizing:border-box;max-height:240px;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-base)}",
      ".dul_accountBlock{display:flex;flex-direction:column;gap:6px}",
      ".dul_accountHint{padding:0 2px;font-size:9px;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_accountRow{box-sizing:border-box;min-height:59px;padding:9px 10px;display:grid;grid-template-columns:30px minmax(0,1fr) auto 16px;align-items:center;gap:10px;border-bottom:1px solid var(--dsw-alias-border-l1)}",
      ".dul_accountRow:last-child{border-bottom:0}",
      ".dul_accountGlyph{width:30px;height:30px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;color:var(--dul-accent);background:color-mix(in srgb,var(--dul-accent) 10%,transparent)}",
      ".dul_accountIdentity{min-width:0;display:flex;flex-direction:column;gap:1px}",
      ".dul_accountName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:680;line-height:16px}",
      ".dul_accountStatus{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_accountStatus[data-state=ok]{color:var(--dsw-alias-state-success-primary)}",
      ".dul_accountStatus[data-state=error]{color:var(--dsw-alias-state-error-primary)}",
      ".dul_accountValue{min-width:0;text-align:right}",
      ".dul_accountAmount{font-size:13px;font-weight:720;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".dul_accountBreakdown{max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px;line-height:13px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
      ".dul_accountRadio{width:14px;height:14px;margin:0;accent-color:var(--dul-accent);cursor:pointer}",
      ".dul_accountRadio:disabled{cursor:not-allowed;opacity:.4}",
      ".dul_accountEmpty{padding:18px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px}",
      ".dul_balanceLabel,.dul_metricLabel{font-size:9px;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_overview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}",
      ".dul_metric{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:11px 12px;background:var(--dsw-alias-bg-base);transition:border-color .16s ease,transform .16s ease}",
      ".dul_metric:hover{border-color:color-mix(in srgb,var(--dul-accent) 18%,var(--dsw-alias-border-l2));transform:translateY(-1px)}",
      ".dul_metricValue{margin-top:4px;font-size:18px;font-weight:700;line-height:24px;letter-spacing:-.015em;font-variant-numeric:tabular-nums}",
      ".dul_estimateNotice{margin-top:-4px;border-radius:9px;padding:7px 9px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-fill-l1);font-size:9px;line-height:15px}",
      ".dul_modelGroups{display:flex;flex-direction:column;gap:7px}",
      ".dul_providerUsage{--dul-usage-token-col:112px;--dul-usage-cost-col:64px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-base)}",
      ".dul_providerUsageHead{padding:8px 10px;display:grid;grid-template-columns:minmax(0,1fr) var(--dul-usage-token-col) var(--dul-usage-cost-col);align-items:center;gap:10px;background:var(--dsw-alias-fill-l1)}",
      ".dul_providerUsageName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:680;line-height:16px}",
      ".dul_providerUsageTotal{text-align:right;font-size:9px;font-weight:620;line-height:15px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".dul_modelRow{padding:8px 10px;display:grid;grid-template-columns:minmax(0,1fr) var(--dul-usage-token-col) var(--dul-usage-cost-col);align-items:center;gap:10px;border-top:1px solid var(--dsw-alias-border-l1)}",
      ".dul_modelName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:580;line-height:16px;color:var(--dsw-alias-label-secondary)}",
      ".dul_modelValue{text-align:right;font-size:9px;font-weight:630;line-height:15px;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".dul_modelEmpty{border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;padding:12px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px}",
      ".dul_dailyTitle{margin:2px 0 0;font-size:10px;font-weight:620;line-height:15px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_heatmap{--dul-heat-gap:clamp(1px,.18vw,3px);border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:9px 9px 8px;background:var(--dsw-alias-bg-base)}",
      ".dul_heatmapViewport{overflow:hidden;padding:3px;margin:-3px}",
      ".dul_heatmapCanvas{width:100%}",
      ".dul_heatmapMonths{height:12px;margin-left:27px;display:grid;grid-template-columns:repeat(27,minmax(0,1fr));gap:var(--dul-heat-gap)}",
      ".dul_heatmapMonth{overflow:visible;font-size:8px;font-weight:580;line-height:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
      ".dul_heatmapBody{display:grid;grid-template-columns:20px minmax(0,1fr);gap:7px}",
      ".dul_heatmapWeekdays{display:grid;grid-template-rows:repeat(7,1fr);gap:var(--dul-heat-gap)}",
      ".dul_heatmapWeekday{display:flex;align-items:center;justify-content:flex-end;font-size:7px;font-weight:550;line-height:1;color:var(--dsw-alias-label-tertiary)}",
      ".dul_heatmapWeeks{display:grid;grid-template-columns:repeat(27,minmax(0,1fr));gap:var(--dul-heat-gap)}",
      ".dul_heatmapWeek{min-width:0;display:grid;grid-template-rows:repeat(7,auto);gap:var(--dul-heat-gap)}",
      ".dul_heatmapDay,.dul_heatmapFuture{box-sizing:border-box;width:100%;height:auto;aspect-ratio:1;border-radius:2px}",
      ".dul_heatmapDay{border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 62%,transparent);padding:0;background:var(--dsw-alias-fill-l1);cursor:pointer;transition:box-shadow .12s ease}",
      ".dul_heatmapDay:hover{box-shadow:0 0 0 1px color-mix(in srgb,var(--dul-accent) 55%,transparent)}",
      ".dul_heatmapDay[data-level='1']{border-color:transparent;background:color-mix(in srgb,var(--dul-accent) 16%,var(--dsw-alias-bg-base))}",
      ".dul_heatmapDay[data-level='2']{border-color:transparent;background:color-mix(in srgb,var(--dul-accent) 32%,var(--dsw-alias-bg-base))}",
      ".dul_heatmapDay[data-level='3']{border-color:transparent;background:color-mix(in srgb,var(--dul-accent) 58%,var(--dsw-alias-bg-base))}",
      ".dul_heatmapDay[data-level='4']{border-color:transparent;background:var(--dul-accent)}",
      ".dul_heatmapDay[data-selected=true]{box-shadow:0 0 0 2px var(--dsw-alias-bg-base),0 0 0 3px var(--dul-accent)}",
      ".dul_selectedDay{margin-top:7px;border-top:1px solid var(--dsw-alias-border-l1);padding-top:7px;display:grid;grid-template-columns:minmax(90px,1fr) auto auto;align-items:center;gap:12px}",
      ".dul_selectedDate{font-size:10px;font-weight:650;line-height:16px;color:var(--dsw-alias-label-secondary)}",
      ".dul_selectedMetric{display:flex;flex-direction:column;align-items:flex-end}",
      ".dul_selectedLabel{font-size:8px;line-height:12px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_selectedValue{font-size:10px;font-weight:680;line-height:16px;font-variant-numeric:tabular-nums;white-space:nowrap}",
      "@media(max-width:600px){.dul_panel{left:8px;right:8px;bottom:8px;width:auto;max-width:none;max-height:calc(100vh - 16px);border-radius:18px}.dul_body{padding:13px}.dul_accountRow{grid-template-columns:30px minmax(0,1fr) auto 16px;gap:8px}.dul_accountBreakdown{max-width:125px}.dul_providerUsage{--dul-usage-token-col:96px;--dul-usage-cost-col:56px}.dul_providerUsageHead,.dul_modelRow{gap:8px}.dul_selectedDay{grid-template-columns:1fr auto;gap:8px}.dul_selectedMetric:last-child{grid-column:2}.dul_tabs{align-self:stretch}.dul_tab{flex:1;min-width:0}}",
      "@media(prefers-reduced-motion:reduce){.dul_panel{animation:none}.dul_icon,.dul_metric{transition:none}}"
    ].join("");
    const tagId = "dsh-usage-lite/client.css";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
      const tag = document.createElement("style");
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    const NS = "usageLite";
    const PREF_KEY = "dsh-usage-lite:prefs";

    function readPrefs() {
      if (typeof localStorage === "undefined") return { hidden: false, providerId: "deepseek-official" };
      try {
        const parsed = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
        return {
          hidden: parsed.hidden === true,
          providerId: typeof parsed.providerId === "string" && parsed.providerId !== "" ? parsed.providerId : "deepseek-official"
        };
      } catch {
        return { hidden: false, providerId: "deepseek-official" };
      }
    }

    function savePrefs(next) {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    }

    function interpolate(template, params) {
      if (params === void 0) return template;
      return template.replace(/\{(\w+)\}/g, (_, key) => Object.hasOwn(params, key) ? String(params[key]) : "");
    }

    function fmtCurrency(value, currency) {
      if (!Number.isFinite(value)) return "—";
      try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "CNY" }).format(value);
      } catch {
        return `${currency || "CNY"} ${value.toFixed(2)}`;
      }
    }

    function fmtInt(value) {
      return Number.isFinite(value) ? value.toLocaleString() : "0";
    }

    function fmtTime(value) {
      if (!Number.isFinite(value)) return "";
      try {
        return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
      } catch {
        return new Date(value).toISOString().slice(11, 16);
      }
    }

    function dateKey(date) {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    }

    function buildUsageHeatmap(days, endDate) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDate ?? "");
      if (match === null) return [];
      const end = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      if (Number.isNaN(end.getTime())) return [];
      const endWeekday = (end.getUTCDay() + 6) % 7;
      const weekEnd = new Date(end);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6 - endWeekday);
      const start = new Date(weekEnd);
      start.setUTCDate(start.getUTCDate() - 27 * 7 + 1);
      const usageByDate = new Map((days ?? []).map((day) => [day.date, day]));
      const maxTokens = Math.max(0, ...(days ?? [])
        .filter((day) => day.date >= dateKey(start) && day.date <= endDate)
        .map((day) => day.tokens ?? 0));

      return Array.from({ length: 27 }, (_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => {
        const current = new Date(start);
        current.setUTCDate(current.getUTCDate() + weekIndex * 7 + dayIndex);
        const date = dateKey(current);
        const active = date <= endDate;
        const usage = active ? usageByDate.get(date) : null;
        const tokens = usage?.tokens ?? 0;
        return {
          date,
          active,
          tokens,
          cost: usage?.cost ?? 0,
          level: tokens > 0 && maxTokens > 0 ? Math.max(1, Math.ceil((tokens / maxTokens) * 4)) : 0
        };
      }));
    }

    function selectSummaryProvider({ providers, summaryProvider, selectedProviderId }) {
      const rows = Array.isArray(providers) ? providers : [];
      const selectable = (provider) => provider?.supported !== false;
      return rows.find((provider) => selectable(provider) && provider?.id === selectedProviderId)
        ?? (selectable(summaryProvider) && summaryProvider?.id === selectedProviderId ? summaryProvider : null)
        ?? rows.find((provider) => selectable(provider) && provider?.id === summaryProvider?.id)
        ?? (selectable(summaryProvider) ? summaryProvider : null)
        ?? rows.find(selectable)
        ?? null;
    }

    function mergeProviderRefresh(provider, previousProviders) {
      if (provider === null || typeof provider !== "object") return provider;
      const previous = previousProviders.find((item) => item?.id === provider.id);
      if (!provider.error || previous?.balance === null || previous?.balance === void 0) return provider;
      return {
        ...provider,
        balance: previous.balance,
        fetchedAt: previous.fetchedAt
      };
    }

    function mergeRefreshResults({ summaryResult, detailResult, previousDetail }) {
      let detail = previousDetail ?? null;
      if (detailResult?.status === "fulfilled") {
        const previousProviders = previousDetail?.providers ?? [];
        const providers = (detailResult.value?.providers ?? []).map((provider) => mergeProviderRefresh(provider, previousProviders));
        const provider = providers.find((item) => item?.id === detailResult.value?.provider?.id)
          ?? mergeProviderRefresh(detailResult.value?.provider, previousProviders);
        detail = { ...detailResult.value, providers, provider };
      }
      return {
        summary: summaryResult?.status === "fulfilled" ? summaryResult.value : null,
        detail
      };
    }

    async function fetchJson(path) {
      const response = await fetch(path, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }

    function providerStatusOf(provider, { refreshing, refreshFailed, t }) {
      const translate = (key, params) => interpolate(t ? t(key) : key, params);
      const balance = provider?.balance;
      const available = balance !== null && balance !== void 0;
      if (provider?.supported === false) return { text: translate("provider.unsupported"), state: "neutral" };
      if (provider?.configured === false) return { text: translate("provider.notConfigured"), state: "neutral" };
      if (refreshing) return { text: translate("action.refreshing"), state: "neutral" };
      if (refreshFailed && available && Number.isFinite(provider?.fetchedAt)) {
        return {
          text: `${translate("action.refreshFailed")} · ${translate("provider.updatedAt", { time: fmtTime(provider.fetchedAt) })}`,
          state: "error"
        };
      }
      if (provider?.error) return { text: translate("provider.queryFailed"), state: "error" };
      if (available && Number.isFinite(provider?.fetchedAt)) {
        return { text: translate("provider.updatedAt", { time: fmtTime(provider.fetchedAt) }), state: "ok" };
      }
      return { text: translate("provider.unavailable"), state: "neutral" };
    }

    function ProviderAccountsView({ providers, selectedProviderId, onSelect, hidden, loading = false, loadFailed = false, refreshing = false, refreshFailed = false, t }) {
      const translate = (key, params) => interpolate(t ? t(key) : key, params);
      const rows = Array.isArray(providers) ? providers : [];
      const content = rows.length === 0
        ? react_jsx_runtime.jsx("div", {
          className: "dul_accountEmpty",
          children: translate(loading ? "provider.loading" : loadFailed ? "provider.loadFailed" : "provider.empty")
        })
        : rows.map((provider) => {
          const balance = provider?.balance;
          const available = balance !== null && balance !== void 0;
          const status = providerStatusOf(provider, { refreshing, refreshFailed, t });
          const amount = hidden ? "••••" : fmtCurrency(balance?.remaining, balance?.currency);
          const granted = hidden ? "••••" : fmtCurrency(balance?.granted, balance?.currency);
          const toppedUp = hidden ? "••••" : fmtCurrency(balance?.toppedUp, balance?.currency);
          const selectionDisabled = provider?.supported === false;
          const providerName = provider.displayName ?? provider.id;
          return react_jsx_runtime.jsxs("div", {
            className: "dul_accountRow",
            role: "listitem",
            children: [
              react_jsx_runtime.jsx("span", {
                className: "dul_accountGlyph",
                children: react_jsx_runtime.jsx(primitives.IconApiOutline14, { size: 14 })
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_accountIdentity",
                children: [
                  react_jsx_runtime.jsx("span", {
                    className: "dul_accountName",
                    title: provider.id,
                    children: providerName
                  }),
                  react_jsx_runtime.jsx("span", {
                    className: "dul_accountStatus",
                    "data-state": status.state,
                    children: status.text
                  })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_accountValue",
                children: [
                  react_jsx_runtime.jsx("div", { className: "dul_accountAmount", children: amount }),
                  available ? react_jsx_runtime.jsx("div", {
                    className: "dul_accountBreakdown",
                    children: translate("provider.balanceBreakdown", { granted, toppedUp })
                  }) : null
                ]
              }),
              react_jsx_runtime.jsx("input", {
                type: "radio",
                className: "dul_accountRadio",
                name: "usage-lite-provider",
                value: provider.id,
                checked: !selectionDisabled && provider.id === selectedProviderId,
                disabled: selectionDisabled,
                title: selectionDisabled
                  ? translate("provider.selectionUnsupported")
                  : translate("provider.selectAccount", { name: providerName }),
                onChange: () => onSelect?.(provider.id),
                "aria-label": translate("provider.selectAccount", { name: providerName })
              })
            ]
          }, provider.id);
        });
      return react_jsx_runtime.jsxs("div", {
        className: "dul_accountBlock",
        children: [
          react_jsx_runtime.jsx("div", { className: "dul_accountHint", children: translate("provider.selectHint") }),
          react_jsx_runtime.jsx("div", {
            className: "dul_accountList",
            role: "list",
            children: content
          })
        ]
      });
    }

    function BillingView({ billing, t }) {
      const translate = (key, params) => interpolate(t ? t(key) : key, params);
      const providers = billing?.providers ?? [];
      const days = billing?.days ?? [];
      const latestDate = days.reduce((latest, day) => day.date > latest ? day.date : latest, "");
      const now = new Date();
      const rangeEnd = latestDate || dateKey(now);
      const [selectedDate, setSelectedDate] = react.useState(null);
      const heatmap = buildUsageHeatmap(days, rangeEnd);
      const heatmapDays = heatmap.flat();
      const selectedKey = selectedDate ?? latestDate;
      const selectedDay = heatmapDays.find((day) => day.date === selectedKey) ?? null;
      const weekdays = translate("billing.weekdays").split("|");
      const monthNames = translate("billing.months").split("|");
      const monthLabels = heatmap.flatMap((week, weekIndex) => {
        const first = week.find((day) => day.active && day.date.endsWith("-01"));
        if (first === void 0) return [];
        const month = Number(first.date.slice(5, 7));
        return [{ weekIndex, label: monthNames[month - 1] ?? String(month) }];
      });

      return react_jsx_runtime.jsxs("div", {
        className: "dul_view",
        children: [
          react_jsx_runtime.jsx("div", { className: "dul_sectionLabel", children: translate("billing.overview") }),
          react_jsx_runtime.jsxs("div", {
            className: "dul_overview",
            children: [
              react_jsx_runtime.jsxs("div", {
                className: "dul_metric",
                children: [
                  react_jsx_runtime.jsx("div", { className: "dul_metricLabel", children: translate("billing.totalTokens") }),
                  react_jsx_runtime.jsx("div", { className: "dul_metricValue", children: fmtInt(billing?.total?.tokens ?? 0) })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_metric",
                children: [
                  react_jsx_runtime.jsx("div", { className: "dul_metricLabel", children: translate("billing.totalCost") }),
                  react_jsx_runtime.jsx("div", { className: "dul_metricValue", children: fmtCurrency(billing?.total?.cost ?? 0, "CNY") })
                ]
              })
            ]
          }),
          react_jsx_runtime.jsx("div", {
            className: "dul_estimateNotice",
            role: "note",
            children: translate("billing.estimatedNotice")
          }),
          react_jsx_runtime.jsxs(react.Fragment, {
            children: [
              react_jsx_runtime.jsx("div", { className: "dul_dailyTitle", children: translate("billing.byModel") }),
              providers.length > 0
                ? react_jsx_runtime.jsx("div", {
                  className: "dul_modelGroups",
                  children: providers.map((provider) => react_jsx_runtime.jsxs("div", {
                    className: "dul_providerUsage",
                    children: [
                      react_jsx_runtime.jsxs("div", {
                        className: "dul_providerUsageHead",
                        children: [
                          react_jsx_runtime.jsx("span", { className: "dul_providerUsageName", children: provider.id }),
                          react_jsx_runtime.jsx("span", {
                            className: "dul_providerUsageTotal",
                            children: translate("billing.dayTokens", { value: fmtInt(provider.tokens) })
                          }),
                          react_jsx_runtime.jsx("span", {
                            className: "dul_providerUsageTotal",
                            children: fmtCurrency(provider.cost, "CNY")
                          })
                        ]
                      }),
                      (provider.models ?? []).map((model) => react_jsx_runtime.jsxs("div", {
                        className: "dul_modelRow",
                        children: [
                          react_jsx_runtime.jsx("span", { className: "dul_modelName", title: model.id, children: model.id }),
                          react_jsx_runtime.jsx("span", {
                            className: "dul_modelValue",
                            children: translate("billing.dayTokens", { value: fmtInt(model.tokens) })
                          }),
                          react_jsx_runtime.jsx("span", {
                            className: "dul_modelValue",
                            children: fmtCurrency(model.cost, "CNY")
                          })
                        ]
                      }, model.id))
                    ]
                  }, provider.id))
                })
                : react_jsx_runtime.jsx("div", {
                  className: "dul_modelEmpty",
                  children: translate("billing.modelsEmpty")
                })
            ]
          }),
          react_jsx_runtime.jsx("div", { className: "dul_dailyTitle", children: translate("billing.daily") }),
          react_jsx_runtime.jsxs("div", {
            className: "dul_heatmap",
            children: [
              react_jsx_runtime.jsx("div", {
                className: "dul_heatmapViewport",
                children: react_jsx_runtime.jsxs("div", {
                  className: "dul_heatmapCanvas",
                  children: [
                    react_jsx_runtime.jsx("div", {
                      className: "dul_heatmapMonths",
                      children: monthLabels.map((item) => react_jsx_runtime.jsx("span", {
                        className: "dul_heatmapMonth",
                        style: { gridColumn: `${item.weekIndex + 1} / span 4` },
                        children: item.label
                      }, `${item.weekIndex}-${item.label}`))
                    }),
                    react_jsx_runtime.jsxs("div", {
                      className: "dul_heatmapBody",
                      children: [
                        react_jsx_runtime.jsx("div", {
                          className: "dul_heatmapWeekdays",
                          children: weekdays.map((weekday, index) => react_jsx_runtime.jsx("span", {
                            className: "dul_heatmapWeekday",
                            children: index === 0 || index === 2 || index === 4 ? weekday : ""
                          }, `${weekday}-${index}`))
                        }),
                        react_jsx_runtime.jsx("div", {
                          className: "dul_heatmapWeeks",
                          role: "grid",
                          children: heatmap.map((week, weekIndex) => react_jsx_runtime.jsx("div", {
                            className: "dul_heatmapWeek",
                            children: week.map((day) => day.active
                              ? react_jsx_runtime.jsx("button", {
                                type: "button",
                                className: "dul_heatmapDay",
                                "data-level": day.level,
                                "data-selected": day.date === selectedKey,
                                onClick: () => setSelectedDate(day.date),
                                title: `${day.date} · ${translate("billing.dayTokens", { value: fmtInt(day.tokens) })} · ${fmtCurrency(day.cost, "CNY")}`,
                                "aria-label": `${day.date}, ${translate("billing.dayTokens", { value: fmtInt(day.tokens) })}, ${fmtCurrency(day.cost, "CNY")}`
                              }, day.date)
                              : react_jsx_runtime.jsx("span", { className: "dul_heatmapFuture" }, day.date))
                          }, `week-${weekIndex}`))
                        })
                      ]
                    })
                  ]
                })
              }),
              selectedDay ? react_jsx_runtime.jsxs("div", {
                className: "dul_selectedDay",
                children: [
                  react_jsx_runtime.jsxs("div", {
                    children: [
                      react_jsx_runtime.jsx("div", { className: "dul_selectedLabel", children: translate("billing.selectedDay") }),
                      react_jsx_runtime.jsx("div", { className: "dul_selectedDate", children: selectedDay.date })
                    ]
                  }),
                  react_jsx_runtime.jsxs("div", {
                    className: "dul_selectedMetric",
                    children: [
                      react_jsx_runtime.jsx("span", { className: "dul_selectedLabel", children: translate("billing.tokens") }),
                      react_jsx_runtime.jsx("span", { className: "dul_selectedValue", children: fmtInt(selectedDay.tokens) })
                    ]
                  }),
                  react_jsx_runtime.jsxs("div", {
                    className: "dul_selectedMetric",
                    children: [
                      react_jsx_runtime.jsx("span", { className: "dul_selectedLabel", children: translate("billing.cost") }),
                      react_jsx_runtime.jsx("span", { className: "dul_selectedValue", children: fmtCurrency(selectedDay.cost, "CNY") })
                    ]
                  })
                ]
              }) : null
            ]
          })
        ]
      });
    }

    function UsageLitePanel({ wide, t }) {
      const translate = (key, params) => interpolate(t ? t(key) : key, params);
      const [open, setOpen] = react.useState(false);
      const [prefs, setPrefs] = react.useState(() => readPrefs());
      const [summary, setSummary] = react.useState(null);
      const [detail, setDetail] = react.useState(null);
      const [hasLoaded, setHasLoaded] = react.useState(false);
      const [refreshing, setRefreshing] = react.useState(true);
      const [refreshFailed, setRefreshFailed] = react.useState(false);
      const [tab, setTab] = react.useState("provider");
      const panelRef = react.useRef(null);
      const triggerRef = react.useRef(null);

      const accountProviders = detail?.providers ?? (summary?.provider ? [summary.provider] : []);
      const selectedProvider = selectSummaryProvider({
        providers: accountProviders,
        summaryProvider: summary?.provider,
        selectedProviderId: prefs.providerId
      });

      const refresh = react.useCallback(async () => {
        setRefreshing(true);
        setRefreshFailed(false);
        const [summaryResult, detailResult] = await Promise.allSettled([
          fetchJson("/api/usage-lite/summary"),
          fetchJson("/api/usage-lite/detail")
        ]);
        if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
        setDetail((previousDetail) => mergeRefreshResults({
          summaryResult,
          detailResult,
          previousDetail
        }).detail);
        setRefreshFailed(
          summaryResult.status === "rejected"
          || detailResult.status === "rejected"
          || Boolean(summaryResult.value?.provider?.error)
          || Boolean(detailResult.value?.providers?.some((provider) => provider?.error))
        );
        setHasLoaded(true);
        setRefreshing(false);
      }, []);

      react.useEffect(() => {
        refresh().catch(() => {});
      }, [refresh]);

      react.useEffect(() => {
        if (!open) return;
        function onPointerDown(event) {
          const target = event.target;
          if (panelRef.current?.contains?.(target) || triggerRef.current?.contains?.(target)) return;
          setOpen(false);
        }
        function onKeyDown(event) {
          if (event.key === "Escape") setOpen(false);
        }
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
          document.removeEventListener("pointerdown", onPointerDown);
          document.removeEventListener("keydown", onKeyDown);
        };
      }, [open]);

      const currentPrefs = prefs;
      const amount = selectedProvider?.balance?.remaining;
      const currency = selectedProvider?.balance?.currency;
      const amountText = selectedProvider === null ? "—" : currentPrefs.hidden ? "••••" : fmtCurrency(amount, currency);
      const noSupportedProvider = hasLoaded && accountProviders.length > 0 && selectedProvider === null;
      const selectedProviderStatus = providerStatusOf(selectedProvider, {
        refreshing: refreshing && hasLoaded,
        refreshFailed,
        t
      });
      const providerName = !hasLoaded
        ? translate("provider.loading")
        : noSupportedProvider
          ? translate("provider.noSupportedBalance")
          : selectedProvider?.displayName ?? selectedProvider?.id ?? translate(refreshFailed ? "provider.loadFailed" : "provider.empty");
      const providerStatus = !hasLoaded
        ? translate("action.refreshing")
        : noSupportedProvider
          ? translate("provider.unsupported")
          : selectedProvider === null
          ? translate(refreshFailed ? "action.refreshFailed" : "provider.unavailable")
          : selectedProviderStatus.text;

      function updatePrefs(next) {
        setPrefs(next);
        savePrefs(next);
      }

      const panel = open ? react_jsx_runtime.jsx("div", {
        className: "dul_panel",
        ref: panelRef,
        children: [
          react_jsx_runtime.jsxs("div", {
            className: "dul_head",
            children: [
              react_jsx_runtime.jsxs("div", {
                className: "dul_headIdentity",
                children: [
                  react_jsx_runtime.jsx("span", {
                    className: "dul_headGlyph",
                    children: react_jsx_runtime.jsx(primitives.IconDataOutline16, { size: 16 })
                  }),
                  react_jsx_runtime.jsx("div", {
                    className: "dul_headText",
                    children: react_jsx_runtime.jsx("div", { className: "dul_headTitle", children: translate("panel.title") })
                  })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_headActions",
                children: [
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dul_close",
                    onClick: () => refresh().catch(() => {}),
                    disabled: refreshing,
                    "data-loading": refreshing,
                    "aria-busy": refreshing,
                    "aria-label": translate("action.refresh"),
                    children: react_jsx_runtime.jsx(primitives.IconRefreshOutline14, { size: 14 })
                  }),
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dul_close",
                    onClick: () => setOpen(false),
                    "aria-label": translate("action.close"),
                    children: react_jsx_runtime.jsx(primitives.IconCloseOutline16, { size: 14 })
                  })
                ]
              })
            ]
          }, "head"),
          react_jsx_runtime.jsxs("div", {
            className: "dul_body",
            children: [
              react_jsx_runtime.jsxs("div", {
                className: "dul_tabs",
                children: [
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dul_tab",
                    "data-on": tab === "provider",
                    onClick: () => setTab("provider"),
                    children: translate("tab.provider")
                  }),
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dul_tab",
                    "data-on": tab === "billing",
                    onClick: () => setTab("billing"),
                    children: translate("tab.billing")
                  })
                ]
              }),
              tab === "provider" ? react_jsx_runtime.jsx("div", {
                className: "dul_sectionLabel",
                children: translate("provider.account")
              }) : null,
              tab === "provider"
                ? react_jsx_runtime.jsx(ProviderAccountsView, {
                  providers: accountProviders,
                  selectedProviderId: selectedProvider?.id,
                  onSelect: (providerId) => updatePrefs({ ...currentPrefs, providerId }),
                  hidden: currentPrefs.hidden,
                  loading: !hasLoaded,
                  loadFailed: hasLoaded && refreshFailed && accountProviders.length === 0,
                  refreshing: refreshing && hasLoaded,
                  refreshFailed,
                  t
                })
                : react_jsx_runtime.jsx(BillingView, { billing: detail?.billing, t })
            ]
          }, "body")
        ]
      }) : null;

      return react_jsx_runtime.jsxs("div", {
        className: "dul_wrap",
        "data-wide": wide,
        children: [
          react_jsx_runtime.jsxs("div", {
            className: "dul_badgeShell",
            "data-open": open,
            ref: triggerRef,
            children: [
              react_jsx_runtime.jsxs("button", {
                type: "button",
                className: "dul_badgeMain",
                onClick: () => setOpen((value) => !value),
                children: [
                  react_jsx_runtime.jsx("span", {
                    className: "dul_badgeGlyph",
                    children: react_jsx_runtime.jsx(primitives.IconDataOutline16, { size: wide ? 15 : 17 })
                  }),
                  react_jsx_runtime.jsxs("span", {
                    className: "dul_badgeContent",
                    children: [
                      react_jsx_runtime.jsxs("span", {
                        className: "dul_badgeTop",
                        children: [
                          react_jsx_runtime.jsx("span", { className: "dul_title", children: translate("panel.title") }),
                          react_jsx_runtime.jsx("span", { className: "dul_amount", children: amountText })
                        ]
                      }),
                      react_jsx_runtime.jsxs("span", {
                        className: "dul_badgeMeta",
                        children: [
                          react_jsx_runtime.jsx("span", { className: "dul_badgeProvider", children: providerName }),
                          react_jsx_runtime.jsx("span", { className: "dul_badgeUpdated", children: providerStatus })
                        ]
                      })
                    ]
                  })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_actions",
                children: [
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dul_icon",
                    "aria-label": translate("action.refresh"),
                    disabled: refreshing,
                    "data-loading": refreshing,
                    "aria-busy": refreshing,
                    onClick: (event) => {
                      event.stopPropagation();
                      refresh().catch(() => {});
                    },
                    children: react_jsx_runtime.jsx(primitives.IconRefreshOutline14, { size: 13 })
                  }),
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "dul_icon",
                    "aria-label": translate("action.toggleVisibility"),
                    onClick: (event) => {
                      event.stopPropagation();
                      updatePrefs({ ...currentPrefs, hidden: !currentPrefs.hidden });
                    },
                    "aria-pressed": currentPrefs.hidden,
                    children: react_jsx_runtime.jsx(primitives.IconInspectOutline12, { size: 13 })
                  })
                ]
              })
            ]
          }),
          panel ? react_dom.createPortal(panel, document.body) : null
        ]
      });
    }

    const zh = {
      "panel.title": "用量与额度",
      "tab.provider": "余额",
      "tab.billing": "用量",
      "provider.account": "供应商账户",
      "provider.unavailable": "暂不可用",
      "provider.updatedAt": "更新于 {time}",
      "provider.unsupported": "暂不支持额度查询",
      "provider.notConfigured": "未配置访问凭据",
      "provider.queryFailed": "额度查询失败",
      "provider.empty": "暂无已配置供应商",
      "provider.noSupportedBalance": "暂无支持额度查询的供应商",
      "provider.loading": "正在读取供应商账户",
      "provider.loadFailed": "供应商账户读取失败，请刷新重试",
      "provider.selectHint": "选择折叠态默认展示账户",
      "provider.selectAccount": "将 {name} 设为折叠态账户",
      "provider.selectionUnsupported": "该供应商暂不支持额度查询",
      "provider.balanceBreakdown": "赠送 {granted} · 充值 {toppedUp}",
      "provider.balance": "当前余额",
      "provider.granted": "赠金额度",
      "provider.toppedUp": "充值额度",
      "billing.overview": "Token 用量",
      "billing.byModel": "供应商与模型明细",
      "billing.modelsEmpty": "暂无供应商或模型用量",
      "billing.estimatedNotice": "开销为估算值，可能与供应商实际账单不同。",
      "billing.daily": "每日用量",
      "billing.weekdays": "一|二|三|四|五|六|日",
      "billing.months": "1月|2月|3月|4月|5月|6月|7月|8月|9月|10月|11月|12月",
      "billing.selectedDay": "当日明细",
      "billing.tokens": "Token",
      "billing.cost": "开销",
      "billing.totalTokens": "总 Token",
      "billing.totalCost": "总开销",
      "billing.dayTokens": "{value} tokens",
      "billing.dayCost": "{value}",
      "billing.empty": "暂无账单数据",
      "action.refresh": "刷新",
      "action.refreshing": "正在刷新",
      "action.refreshFailed": "刷新失败",
      "action.toggleVisibility": "隐藏或显示额度",
      "action.close": "关闭"
    };
    const en = {
      "panel.title": "Usage & Balance",
      "tab.provider": "Balance",
      "tab.billing": "Usage",
      "provider.account": "Provider accounts",
      "provider.unavailable": "Unavailable",
      "provider.updatedAt": "Updated {time}",
      "provider.unsupported": "Balance lookup is not supported",
      "provider.notConfigured": "Credential not configured",
      "provider.queryFailed": "Balance lookup failed",
      "provider.empty": "No configured providers",
      "provider.noSupportedBalance": "No providers support balance lookup",
      "provider.loading": "Loading provider accounts",
      "provider.loadFailed": "Could not load provider accounts. Try refreshing.",
      "provider.selectHint": "Choose the account shown when collapsed",
      "provider.selectAccount": "Show {name} when collapsed",
      "provider.selectionUnsupported": "This provider does not support balance lookup",
      "provider.balanceBreakdown": "Granted {granted} · topped up {toppedUp}",
      "provider.balance": "Current balance",
      "provider.granted": "Granted",
      "provider.toppedUp": "Topped up",
      "billing.overview": "Token usage",
      "billing.byModel": "Usage by provider and model",
      "billing.modelsEmpty": "No provider or model usage yet",
      "billing.estimatedNotice": "Costs are estimates and may differ from provider billing.",
      "billing.daily": "Daily usage",
      "billing.weekdays": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
      "billing.months": "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec",
      "billing.selectedDay": "Selected day",
      "billing.tokens": "Tokens",
      "billing.cost": "Cost",
      "billing.totalTokens": "Total tokens",
      "billing.totalCost": "Total cost",
      "billing.dayTokens": "{value} tokens",
      "billing.dayCost": "{value}",
      "billing.empty": "No billing data yet",
      "action.refresh": "Refresh",
      "action.refreshing": "Refreshing",
      "action.refreshFailed": "Refresh failed",
      "action.toggleVisibility": "Toggle balance visibility",
      "action.close": "Close"
    };

    const inject = ["slots", "locale"];
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "usage-lite:locale");
      ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
        name: "sidebar.footer.action",
        id: "usage-lite",
        locale: NS,
        order: 10
      }, UsageLitePanel));
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.ProviderAccountsView = ProviderAccountsView;
    exports.BillingView = BillingView;
    exports.buildUsageHeatmap = buildUsageHeatmap;
    exports.selectSummaryProvider = selectSummaryProvider;
    exports.mergeRefreshResults = mergeRefreshResults;
    exports.UsageLitePanel = UsageLitePanel;
    return module.exports;
  }
});
