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
      ".dul_panel{--dul-accent:#2563eb;--dul-series-0:#2563eb;--dul-series-1:#f59e0b;--dul-series-2:#10b981;--dul-series-3:#8b5cf6;--dul-series-4:#ec4899;--dul-series-other:#94a3b8;box-sizing:border-box;position:fixed;left:12px;bottom:128px;z-index:100;width:840px;max-width:calc(100vw - 24px);max-height:min(80vh,720px);background:color-mix(in srgb,var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-base)) 96%,#eef4ff);border:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 78%,#b8ccff);border-radius:18px;box-shadow:0 24px 64px rgba(30,64,175,.14),0 6px 20px rgba(15,23,42,.08);display:flex;flex-direction:column;overflow:hidden;animation:dul_enter .2s cubic-bezier(.2,.8,.2,1)}",
      // Lift the palette on dark backgrounds so segments stay separable.
      "[data-ds-dark-theme] .dul_panel{--dul-series-0:#60a5fa;--dul-series-1:#fbbf24;--dul-series-2:#34d399;--dul-series-3:#a78bfa;--dul-series-4:#f472b6;--dul-series-other:#7c8798}",
      "@keyframes dul_enter{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}",
      ".dul_head{box-sizing:border-box;min-height:52px;padding:9px 10px 9px 14px;border-bottom:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:space-between;gap:10px;background:color-mix(in srgb,var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-base)) 92%,transparent)}",
      ".dul_headIdentity{min-width:0;display:flex;align-items:center;gap:9px}",
      ".dul_headGlyph{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dul-accent);background:color-mix(in srgb,var(--dul-accent) 10%,transparent)}",
      ".dul_headText{min-width:0;display:flex;align-items:baseline;gap:8px}",
      ".dul_headTitle{flex:none;font-size:14px;font-weight:680;line-height:20px;letter-spacing:.005em}",
      ".dul_headNotice{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;font-size:9px;font-weight:500;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_headActions{display:flex;align-items:center;gap:2px;flex:none}",
      ".dul_close{box-sizing:border-box;width:26px;height:26px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}",
      ".dul_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".dul_body{padding:15px 16px 17px;display:flex;flex-direction:column;gap:14px;overflow:auto;overscroll-behavior:contain}",
      ".dul_sectionLabel{display:block;margin:0 0 6px;font-size:10px;font-weight:600;line-height:15px;color:var(--dsw-alias-label-tertiary);letter-spacing:.02em}",
      ".dul_columns{display:grid;grid-template-columns:312px minmax(0,1fr);gap:15px;align-items:start}",
      ".dul_colLeft{min-width:0;display:flex;flex-direction:column;gap:12px}",
      ".dul_colRight{min-width:0;display:flex;flex-direction:column;gap:12px;padding-left:14px;border-left:1px solid var(--dsw-alias-border-l2)}",
      ".dul_view{display:flex;flex-direction:column;gap:12px}",
      ".dul_hero{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:13px 14px;background:linear-gradient(180deg,color-mix(in srgb,var(--dul-accent) 7%,var(--dsw-alias-bg-base)),var(--dsw-alias-bg-base))}",
      ".dul_heroTop{display:flex;align-items:center;justify-content:space-between;gap:8px}",
      ".dul_heroLabel{font-size:9px;font-weight:560;line-height:14px;color:var(--dsw-alias-label-tertiary);letter-spacing:.02em}",
      ".dul_heroValue{margin-top:3px;font-size:24px;font-weight:730;line-height:30px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}",
      ".dul_heroName{margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;font-weight:580;line-height:15px;color:var(--dsw-alias-label-secondary)}",
      ".dul_heroStatus{font-size:9px;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_heroStatus[data-state=ok]{color:var(--dsw-alias-state-success-primary)}",
      ".dul_heroStatus[data-state=error]{color:var(--dsw-alias-state-error-primary)}",
      ".dul_heroSplit{margin-top:11px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}",
      ".dul_heroCellLabel{font-size:8px;line-height:12px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_heroCellValue{margin-top:2px;font-size:12px;font-weight:660;line-height:17px;font-variant-numeric:tabular-nums}",
      ".dul_chartCard{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:12px 13px 10px;background:var(--dsw-alias-bg-base)}",
      ".dul_chartHead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:11px}",
      ".dul_chartTitle{font-size:10px;font-weight:640;line-height:15px;color:var(--dsw-alias-label-secondary)}",
      ".dul_chartTotal{font-size:9px;font-weight:600;line-height:14px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
      ".dul_delta{display:inline-flex;align-items:center;gap:2px;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:640;line-height:15px;font-variant-numeric:tabular-nums;background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-tertiary)}",
      ".dul_delta[data-dir=up]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}",
      ".dul_delta[data-dir=down]{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 13%,transparent);color:var(--dsw-alias-state-success-primary)}",
      // No grid gap: gaps were dead click targets, so the visual spacing comes from
      // each column's own horizontal padding and every pixel now selects a day.
      ".dul_bars{height:104px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:0;align-items:end}",
      // The top padding is load-bearing: a full-height bar used to reach the column's
      // exact top edge, so the tallest day's stack (and the 3px selected ring, which
      // is drawn outside the stack) spilled past the hover/selected tint. The headroom
      // keeps the ring inside the tinted box.
      ".dul_barCol{box-sizing:border-box;min-width:0;height:100%;border:0;padding:6px 3.5px 0;background:transparent;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;cursor:pointer;font:inherit;border-radius:6px;transition:background .14s ease}",
      ".dul_barCol:hover{background:color-mix(in srgb,var(--dul-accent) 6%,transparent)}",
      ".dul_barTrack{width:100%;flex:1;display:flex;align-items:flex-end;justify-content:center}",
      // Stacked per-model segments; slot colors come from the palette below.
      ".dul_barStack{width:76%;min-height:3px;display:flex;flex-direction:column;border-radius:5px 5px 3px 3px;overflow:hidden;background:var(--dul-series-0);transition:height .22s cubic-bezier(.2,.8,.2,1),filter .14s ease}",
      ".dul_barSeg{display:block;width:100%;min-height:1px;background:var(--dul-seg,var(--dul-series-0))}",
      ".dul_barSeg[data-slot='0']{--dul-seg:var(--dul-series-0)}",
      ".dul_barSeg[data-slot='1']{--dul-seg:var(--dul-series-1)}",
      ".dul_barSeg[data-slot='2']{--dul-seg:var(--dul-series-2)}",
      ".dul_barSeg[data-slot='3']{--dul-seg:var(--dul-series-3)}",
      ".dul_barSeg[data-slot='4']{--dul-seg:var(--dul-series-4)}",
      ".dul_barSeg[data-slot='5']{--dul-seg:var(--dul-series-other)}",
      ".dul_barCol:hover .dul_barStack{filter:brightness(1.09)}",
      ".dul_barCol[data-selected=true] .dul_barStack{box-shadow:0 0 0 2px var(--dsw-alias-bg-base),0 0 0 3px var(--dul-accent)}",
      // A zero day's bar is a hairline, so the column tint carries the selected state.
      ".dul_barCol[data-selected=true]{background:color-mix(in srgb,var(--dul-accent) 10%,transparent)}",
      ".dul_barStack[data-zero=true]{background:var(--dsw-alias-fill-l2)}",
      ".dul_barTick{font-size:8px;font-weight:550;line-height:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
      ".dul_barCol[data-selected=true] .dul_barTick{color:var(--dul-accent);font-weight:680}",
      ".dul_chartEmpty{height:104px;display:flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary);font-size:10px}",
      ".dul_dayLegend{margin-top:9px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}",
      ".dul_dayLegendHead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:6px}",
      ".dul_dayLegendDate{font-size:10px;font-weight:660;line-height:15px;color:var(--dul-accent);font-variant-numeric:tabular-nums}",
      ".dul_dayLegendTotal{font-size:9px;font-weight:620;line-height:14px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".dul_dayLegendEmpty{padding:2px 0 1px;font-size:9px;line-height:14px;color:var(--dsw-alias-label-tertiary)}",
      ".dul_legend{display:flex;flex-wrap:wrap;gap:3px 10px;padding-top:2px}",
      ".dul_legendItem{min-width:0;display:inline-flex;align-items:center;gap:4px;font-size:9px;line-height:14px;color:var(--dsw-alias-label-secondary)}",
      ".dul_legendSwatch{width:7px;height:7px;flex:none;border-radius:2px;background:var(--dul-seg,var(--dul-series-0))}",
      ".dul_legendSwatch[data-slot='0']{--dul-seg:var(--dul-series-0)}",
      ".dul_legendSwatch[data-slot='1']{--dul-seg:var(--dul-series-1)}",
      ".dul_legendSwatch[data-slot='2']{--dul-seg:var(--dul-series-2)}",
      ".dul_legendSwatch[data-slot='3']{--dul-seg:var(--dul-series-3)}",
      ".dul_legendSwatch[data-slot='4']{--dul-seg:var(--dul-series-4)}",
      ".dul_legendSwatch[data-slot='5']{--dul-seg:var(--dul-series-other)}",
      ".dul_legendName{min-width:0;max-width:118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dul_legendValue{flex:none;font-weight:620;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary)}",
      ".dul_accountList{box-sizing:border-box;max-height:214px;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-base)}",
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
      ".dul_overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}",
      ".dul_metric{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:9px 10px;background:var(--dsw-alias-bg-base);transition:border-color .16s ease,transform .16s ease}",
      ".dul_metric:hover{border-color:color-mix(in srgb,var(--dul-accent) 18%,var(--dsw-alias-border-l2));transform:translateY(-1px)}",
      ".dul_metricValue{margin-top:3px;font-size:15px;font-weight:700;line-height:21px;letter-spacing:-.015em;font-variant-numeric:tabular-nums}",
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
      // Heatmap alignment: one grid owns both rows, so the month labels and the week
      // columns are literally the same grid column and can never drift apart. The
      // weekday gutter is max-content, so it hugs its text ("一" 8px, "Wed" 18px)
      // instead of leaving a dead pocket between the labels and the first column,
      // and the label ink lands flush against the card padding like the grid's right edge.
      ".dul_heatmap{--dul-heat-gap:clamp(1px,.18vw,3px);--dul-heat-label-gap:5px;border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:9px 9px 8px;background:var(--dsw-alias-bg-base)}",
      ".dul_heatmapViewport{overflow:hidden;padding:3px;margin:-3px}",
      ".dul_heatmapCanvas{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:var(--dul-heat-label-gap)}",
      ".dul_heatmapMonths{grid-area:1/2;height:12px;display:grid;grid-template-columns:repeat(27,minmax(0,1fr));gap:var(--dul-heat-gap)}",
      ".dul_heatmapMonth{overflow:visible;font-size:8px;font-weight:580;line-height:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
      ".dul_heatmapWeekdays{grid-area:2/1;display:grid;grid-template-rows:repeat(7,1fr);gap:var(--dul-heat-gap)}",
      ".dul_heatmapWeekday{display:flex;align-items:center;justify-content:flex-end;font-size:8px;font-weight:550;line-height:1;color:var(--dsw-alias-label-tertiary);white-space:nowrap}",
      ".dul_heatmapWeeks{grid-area:2/2;display:grid;grid-template-columns:repeat(27,minmax(0,1fr));gap:var(--dul-heat-gap)}",
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
      "@media(max-width:840px){.dul_panel{width:540px}.dul_columns{grid-template-columns:minmax(0,1fr)}.dul_colRight{padding-left:0;border-left:0;border-top:1px solid var(--dsw-alias-border-l2);padding-top:13px}.dul_overview{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media(max-width:600px){.dul_panel{left:8px;right:8px;bottom:8px;width:auto;max-width:none;max-height:calc(100vh - 16px);border-radius:18px}.dul_body{padding:13px}.dul_accountRow{grid-template-columns:30px minmax(0,1fr) auto 16px;gap:8px}.dul_accountBreakdown{max-width:125px}.dul_providerUsage{--dul-usage-token-col:96px;--dul-usage-cost-col:56px}.dul_providerUsageHead,.dul_modelRow{gap:8px}.dul_selectedDay{grid-template-columns:1fr auto;gap:8px}.dul_selectedMetric:last-child{grid-column:2}.dul_barCol{padding:6px 2.5px 0}}",
      "@media(prefers-reduced-motion:reduce){.dul_panel{animation:none}.dul_icon,.dul_metric,.dul_barStack{transition:none}}"
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

    function fmtCompact(value) {
      if (!Number.isFinite(value)) return "0";
      const abs = Math.abs(value);
      if (abs >= 1e9) return `${(value / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
      if (abs >= 1e6) return `${(value / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
      if (abs >= 1e4) return `${(value / 1e3).toFixed(0)}K`;
      if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return String(Math.round(value));
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

    // Distinct series slots; the palette itself lives in CSS so themes can retune it.
    const TREND_SERIES_SLOTS = 5;

    function modelTokensOf(day) {
      const totals = new Map();
      for (const provider of day?.providers ?? []) {
        for (const model of provider?.models ?? []) {
          const id = typeof model?.id === "string" && model.id !== "" ? model.id : "unknown";
          totals.set(id, (totals.get(id) ?? 0) + (model?.tokens ?? 0));
        }
      }
      return totals;
    }

    function buildDailyTrend(days, endDate, span = 7) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDate ?? "");
      const length = Number.isInteger(span) && span > 0 ? span : 7;
      const empty = { bars: [], total: 0, cost: 0, max: 0, average: 0, delta: null, series: [] };
      if (match === null) return empty;
      const end = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      if (Number.isNaN(end.getTime())) return empty;
      const usageByDate = new Map((days ?? []).map((day) => [day.date, day]));
      const dayAt = (offset) => {
        const cursor = new Date(end);
        cursor.setUTCDate(cursor.getUTCDate() + offset);
        return cursor;
      };
      const window = Array.from({ length }, (_, index) => {
        const cursor = dayAt(index - (length - 1));
        const date = dateKey(cursor);
        const usage = usageByDate.get(date);
        return {
          date,
          usage,
          tokens: usage?.tokens ?? 0,
          cost: usage?.cost ?? 0,
          weekday: (cursor.getUTCDay() + 6) % 7,
          models: modelTokensOf(usage)
        };
      });

      // Rank models across the whole window so colors stay stable between days.
      const windowTotals = new Map();
      for (const day of window) {
        for (const [id, tokens] of day.models) windowTotals.set(id, (windowTotals.get(id) ?? 0) + tokens);
      }
      const ranked = [...windowTotals.entries()]
        .filter(([, tokens]) => tokens > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const named = ranked.slice(0, TREND_SERIES_SLOTS);
      const overflow = ranked.slice(TREND_SERIES_SLOTS);
      const slotOf = new Map(named.map(([id], index) => [id, index]));
      const series = named.map(([id, tokens], index) => ({ id, tokens, slot: index, other: false }));
      if (overflow.length > 0) {
        series.push({
          id: "__other__",
          tokens: overflow.reduce((sum, [, tokens]) => sum + tokens, 0),
          slot: TREND_SERIES_SLOTS,
          other: true,
          count: overflow.length
        });
      }

      const total = window.reduce((sum, day) => sum + day.tokens, 0);
      const cost = window.reduce((sum, day) => sum + day.cost, 0);
      const max = Math.max(0, ...window.map((day) => day.tokens));
      let previous = 0;
      for (let index = 0; index < length; index += 1) {
        previous += usageByDate.get(dateKey(dayAt(index - (length * 2 - 1))))?.tokens ?? 0;
      }

      const bars = window.map((day) => {
        const grouped = new Map();
        for (const [id, tokens] of day.models) {
          if (tokens <= 0) continue;
          const slot = slotOf.get(id);
          if (slot === void 0) {
            const bucket = grouped.get("__other__") ?? { id: "__other__", tokens: 0, slot: TREND_SERIES_SLOTS, other: true };
            bucket.tokens += tokens;
            grouped.set("__other__", bucket);
          } else {
            grouped.set(id, { id, tokens, slot, other: false });
          }
        }
        const segments = [...grouped.values()].sort((a, b) => a.slot - b.slot);
        const segmentTotal = segments.reduce((sum, segment) => sum + segment.tokens, 0);
        return {
          date: day.date,
          tokens: day.tokens,
          cost: day.cost,
          weekday: day.weekday,
          ratio: max > 0 ? day.tokens / max : 0,
          // Share is of the day's own stack, so segments always fill the bar exactly.
          segments: segments.map((segment) => ({
            ...segment,
            share: segmentTotal > 0 ? segment.tokens / segmentTotal : 0
          }))
        };
      });

      return {
        bars,
        total,
        cost,
        max,
        average: total / length,
        // No baseline (or a zero baseline) yields no percentage rather than Infinity.
        delta: previous > 0 ? (total - previous) / previous : null,
        series
      };
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

    function UsageTrendChart({ trend, weekdays, selectedDate, onSelect, t }) {
      const translate = (key, params) => interpolate(t ? t(key) : key, params);
      const bars = trend?.bars ?? [];
      const series = trend?.series ?? [];
      const hasUsage = bars.some((bar) => bar.tokens > 0);
      const delta = trend?.delta;
      const deltaDirection = delta === null || delta === void 0 || Math.abs(delta) < 0.005
        ? "flat"
        : delta > 0 ? "up" : "down";
      const deltaText = delta === null || delta === void 0
        ? translate("billing.deltaNone")
        : `${delta > 0 ? "+" : ""}${Math.round(delta * 100)}%`;
      const seriesLabel = (entry) => entry.other ? translate("billing.otherModels", { count: entry.count ?? 0 }) : entry.id;
      const labelById = new Map(series.map((entry) => [entry.id, seriesLabel(entry)]));
      const selectedBar = bars.find((bar) => bar.date === selectedDate) ?? null;
      // Per-day model breakdown, appended to the native tooltip.
      const barTooltip = (bar) => [
        `${bar.date} · ${translate("billing.dayTokens", { value: fmtInt(bar.tokens) })} · ${fmtCurrency(bar.cost, "CNY")}`,
        ...bar.segments.map((segment) => {
          const name = labelById.get(segment.id) ?? segment.id;
          return `  ${name}: ${fmtInt(segment.tokens)} (${Math.round(segment.share * 100)}%)`;
        })
      ].join("\n");

      return react_jsx_runtime.jsxs("div", {
        className: "dul_chartCard",
        children: [
          react_jsx_runtime.jsxs("div", {
            className: "dul_chartHead",
            children: [
              react_jsx_runtime.jsx("span", { className: "dul_chartTitle", children: translate("billing.trend7d") }),
              react_jsx_runtime.jsxs("span", {
                className: "dul_chartTotal",
                children: [
                  translate("billing.dayTokens", { value: fmtCompact(trend?.total ?? 0) }),
                  " · ",
                  react_jsx_runtime.jsx("span", {
                    className: "dul_delta",
                    "data-dir": deltaDirection,
                    title: translate("billing.deltaHint"),
                    children: deltaText
                  })
                ]
              })
            ]
          }),
          hasUsage
            ? react_jsx_runtime.jsx("div", {
              className: "dul_bars",
              role: "list",
              children: bars.map((bar) => react_jsx_runtime.jsxs("button", {
                type: "button",
                className: "dul_barCol",
                role: "listitem",
                "data-selected": bar.date === selectedDate,
                onClick: () => onSelect?.(bar.date),
                title: barTooltip(bar),
                "aria-label": `${bar.date}, ${translate("billing.dayTokens", { value: fmtInt(bar.tokens) })}, ${fmtCurrency(bar.cost, "CNY")}`,
                children: [
                  react_jsx_runtime.jsx("span", {
                    className: "dul_barTrack",
                    children: react_jsx_runtime.jsx("span", {
                      className: "dul_barStack",
                      "data-zero": bar.tokens === 0,
                      // Floor keeps an empty day visible as a hairline instead of vanishing.
                      style: { height: `${bar.tokens === 0 ? 3 : Math.max(6, Math.round(bar.ratio * 100))}%` },
                      children: bar.segments.length === 0
                        ? null
                        // Tallest slice first: the stack is rendered top-down.
                        : bar.segments.map((segment) => react_jsx_runtime.jsx("span", {
                          className: "dul_barSeg",
                          "data-slot": segment.slot,
                          style: { height: `${segment.share * 100}%` }
                        }, segment.id))
                    })
                  }),
                  react_jsx_runtime.jsx("span", {
                    className: "dul_barTick",
                    children: weekdays?.[bar.weekday] ?? bar.date.slice(8)
                  })
                ]
              }, bar.date))
            })
            : react_jsx_runtime.jsx("div", { className: "dul_chartEmpty", children: translate("billing.empty") }),
          // The strip under the bars follows the clicked day. It used to be a
          // window-scoped legend that never changed on click, and because a window
          // can hold a single active day its totals read as "today" no matter which
          // bar you picked. Colors still come from the window-wide ranking, so a
          // model keeps its color across days.
          hasUsage
            ? react_jsx_runtime.jsxs("div", {
              className: "dul_dayLegend",
              children: [
                react_jsx_runtime.jsxs("div", {
                  className: "dul_dayLegendHead",
                  children: [
                    react_jsx_runtime.jsx("span", {
                      className: "dul_dayLegendDate",
                      children: selectedBar === null ? translate("billing.pickDay") : selectedBar.date
                    }),
                    selectedBar === null ? null : react_jsx_runtime.jsxs("span", {
                      className: "dul_dayLegendTotal",
                      children: [
                        translate("billing.dayTokens", { value: fmtInt(selectedBar.tokens) }),
                        " · ",
                        fmtCurrency(selectedBar.cost, "CNY")
                      ]
                    })
                  ]
                }),
                selectedBar === null
                  ? null
                  : selectedBar.segments.length === 0
                    ? react_jsx_runtime.jsx("div", {
                      className: "dul_dayLegendEmpty",
                      children: translate("billing.dayEmpty")
                    })
                    : react_jsx_runtime.jsx("div", {
                      className: "dul_legend",
                      children: selectedBar.segments.map((segment) => react_jsx_runtime.jsxs("span", {
                        className: "dul_legendItem",
                        title: `${labelById.get(segment.id) ?? segment.id} · ${translate("billing.dayTokens", { value: fmtInt(segment.tokens) })}`,
                        children: [
                          react_jsx_runtime.jsx("span", { className: "dul_legendSwatch", "data-slot": segment.slot }),
                          react_jsx_runtime.jsx("span", {
                            className: "dul_legendName",
                            children: labelById.get(segment.id) ?? segment.id
                          }),
                          react_jsx_runtime.jsx("span", {
                            className: "dul_legendValue",
                            children: `${fmtCompact(segment.tokens)} · ${Math.round(segment.share * 100)}%`
                          })
                        ]
                      }, segment.id))
                    })
              ]
            })
            : null
        ]
      });
    }

    function BalanceColumn({ provider, providers, selectedProviderId, onSelect, hidden, loading, loadFailed, refreshing, refreshFailed, t }) {
      const translate = (key, params) => interpolate(t ? t(key) : key, params);
      const balance = provider?.balance;
      const available = balance !== null && balance !== void 0;
      const status = providerStatusOf(provider, { refreshing, refreshFailed, t });
      const mask = (value) => hidden ? "••••" : fmtCurrency(value, balance?.currency);
      const rows = Array.isArray(providers) ? providers : [];
      // selectSummaryProvider only yields null when no row supports balance lookup,
      // so a populated list with no selection means "unsupported", not "unconfigured".
      const noSupportedProvider = provider === null || provider === void 0;
      const heroName = loading
        ? translate("provider.loading")
        : loadFailed
          ? translate("provider.loadFailed")
          : noSupportedProvider
            ? translate(rows.length > 0 ? "provider.noSupportedBalance" : "provider.empty")
            : provider?.displayName ?? provider?.id;
      const heroStatus = loading
        ? translate("action.refreshing")
        : loadFailed
          ? translate("action.refreshFailed")
          : noSupportedProvider
            ? translate(rows.length > 0 ? "provider.unsupported" : "provider.unavailable")
            : status.text;
      const heroState = loading ? "neutral" : loadFailed ? "error" : noSupportedProvider ? "neutral" : status.state;

      return react_jsx_runtime.jsxs("div", {
        className: "dul_view",
        children: [
          react_jsx_runtime.jsxs("div", {
            className: "dul_hero",
            children: [
              react_jsx_runtime.jsxs("div", {
                className: "dul_heroTop",
                children: [
                  react_jsx_runtime.jsx("span", { className: "dul_heroLabel", children: translate("provider.balance") }),
                  react_jsx_runtime.jsx("span", {
                    className: "dul_heroStatus",
                    "data-state": heroState,
                    children: heroStatus
                  })
                ]
              }),
              react_jsx_runtime.jsx("div", {
                className: "dul_heroValue",
                children: noSupportedProvider ? "—" : mask(balance?.remaining)
              }),
              react_jsx_runtime.jsx("div", {
                className: "dul_heroName",
                title: provider?.id,
                children: heroName
              }),
              available ? react_jsx_runtime.jsxs("div", {
                className: "dul_heroSplit",
                children: [
                  react_jsx_runtime.jsxs("div", {
                    children: [
                      react_jsx_runtime.jsx("div", { className: "dul_heroCellLabel", children: translate("provider.granted") }),
                      react_jsx_runtime.jsx("div", { className: "dul_heroCellValue", children: mask(balance?.granted) })
                    ]
                  }),
                  react_jsx_runtime.jsxs("div", {
                    children: [
                      react_jsx_runtime.jsx("div", { className: "dul_heroCellLabel", children: translate("provider.toppedUp") }),
                      react_jsx_runtime.jsx("div", { className: "dul_heroCellValue", children: mask(balance?.toppedUp) })
                    ]
                  })
                ]
              }) : null
            ]
          }),
          react_jsx_runtime.jsxs("div", {
            children: [
              react_jsx_runtime.jsx("div", { className: "dul_sectionLabel", children: translate("provider.account") }),
              react_jsx_runtime.jsx(ProviderAccountsView, {
                providers,
                selectedProviderId,
                onSelect,
                hidden,
                loading,
                loadFailed,
                refreshing,
                refreshFailed,
                t
              })
            ]
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
      const trend = buildDailyTrend(days, rangeEnd, 7);
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
                  react_jsx_runtime.jsx("div", {
                    className: "dul_metricValue",
                    title: fmtInt(billing?.total?.tokens ?? 0),
                    children: fmtCompact(billing?.total?.tokens ?? 0)
                  })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_metric",
                children: [
                  react_jsx_runtime.jsx("div", { className: "dul_metricLabel", children: translate("billing.totalCost") }),
                  react_jsx_runtime.jsx("div", { className: "dul_metricValue", children: fmtCurrency(billing?.total?.cost ?? 0, "CNY") })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_metric",
                children: [
                  react_jsx_runtime.jsx("div", { className: "dul_metricLabel", children: translate("billing.tokens7d") }),
                  react_jsx_runtime.jsx("div", {
                    className: "dul_metricValue",
                    title: fmtInt(trend.total),
                    children: fmtCompact(trend.total)
                  })
                ]
              }),
              react_jsx_runtime.jsxs("div", {
                className: "dul_metric",
                children: [
                  react_jsx_runtime.jsx("div", { className: "dul_metricLabel", children: translate("billing.dailyAverage") }),
                  react_jsx_runtime.jsx("div", {
                    className: "dul_metricValue",
                    title: fmtInt(Math.round(trend.average)),
                    children: fmtCompact(Math.round(trend.average))
                  })
                ]
              })
            ]
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
          // Lower half: the two time-series views (bars then heatmap) share one section label.
          react_jsx_runtime.jsx("div", { className: "dul_sectionLabel dul_sectionLabelTrend", children: translate("billing.trends") }),
          react_jsx_runtime.jsx(UsageTrendChart, {
            trend,
            weekdays,
            selectedDate: selectedKey,
            onSelect: setSelectedDate,
            t
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

      const panel = open ? react_jsx_runtime.jsxs("div", {
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
                  react_jsx_runtime.jsxs("div", {
                    className: "dul_headText",
                    children: [
                      react_jsx_runtime.jsx("div", { className: "dul_headTitle", children: translate("panel.title") })
                    ]
                  })
                ]
              }),
              // Fills the header's dead space and saves a full row in the right column.
              react_jsx_runtime.jsx("div", {
                className: "dul_headNotice",
                role: "note",
                children: translate("billing.estimatedNotice")
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
          react_jsx_runtime.jsx("div", {
            className: "dul_body",
            children: react_jsx_runtime.jsxs("div", {
              className: "dul_columns",
              children: [
                react_jsx_runtime.jsx("div", {
                  className: "dul_colLeft",
                  children: react_jsx_runtime.jsx(BalanceColumn, {
                    provider: selectedProvider,
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
                }, "left"),
                react_jsx_runtime.jsx("div", {
                  className: "dul_colRight",
                  children: react_jsx_runtime.jsx(BillingView, { billing: detail?.billing, t })
                }, "right")
              ]
            })
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
      "billing.trends": "用量趋势",
      "billing.pickDay": "点击柱子查看当日构成",
      "billing.dayEmpty": "当日无用量",
      "billing.trend7d": "近 7 日趋势",
      "billing.tokens7d": "近 7 日 Token",
      "billing.dailyAverage": "日均 Token",
      "billing.deltaNone": "无对比",
      "billing.deltaHint": "与前 7 日相比的变化",
      "billing.otherModels": "其他 {count} 个模型",
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
      "billing.trends": "Usage trends",
      "billing.pickDay": "Pick a day to see its models",
      "billing.dayEmpty": "No usage on this day",
      "billing.trend7d": "Last 7 days",
      "billing.tokens7d": "7-day tokens",
      "billing.dailyAverage": "Daily average",
      "billing.deltaNone": "No baseline",
      "billing.deltaHint": "Change versus the previous 7 days",
      "billing.otherModels": "{count} other models",
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
    exports.BalanceColumn = BalanceColumn;
    exports.BillingView = BillingView;
    exports.UsageTrendChart = UsageTrendChart;
    exports.buildUsageHeatmap = buildUsageHeatmap;
    exports.buildDailyTrend = buildDailyTrend;
    exports.fmtCompact = fmtCompact;
    exports.selectSummaryProvider = selectSummaryProvider;
    exports.mergeRefreshResults = mergeRefreshResults;
    exports.UsageLitePanel = UsageLitePanel;
    return module.exports;
  }
});
