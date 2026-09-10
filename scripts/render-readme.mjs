// Render the real client with fixed, synthetic billing and the host's visual assets.
// Optional tooling is deliberately separate from the plugin's runtime dependencies.
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectBilling } from "../lib/index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const themePath = process.env.DSH_THEME_CSS;
const primitivesPath = process.env.DSH_PRIMITIVES_JS;
if (!themePath || !primitivesPath) {
  throw new Error("Set DSH_THEME_CSS and DSH_PRIMITIVES_JS to local DSH assets; see README.md.");
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
  : "playwright");
const [source, themeCss, primitiveSource, reactUmd, reactDomUmd] = await Promise.all([
  readFile(join(root, "lib/client.js"), "utf8"),
  readFile(themePath, "utf8"),
  readFile(primitivesPath, "utf8"),
  readFile(join(dirname(require.resolve("react/package.json")), "umd/react.production.min.js"), "utf8"),
  readFile(join(dirname(require.resolve("react-dom/package.json")), "umd/react-dom.production.min.js"), "utf8")
]);

// Extract only the standalone SVG components used by this client. This avoids
// importing unrelated host widgets and fails explicitly if the host format changes.
const iconNames = [...new Set([...source.matchAll(/primitives\.(Icon\w+)/g)].map((match) => match[1]))];
const iconSource = iconNames.map((name) => {
  const match = primitiveSource.match(new RegExp(`^const ${name} = [\\s\\S]*?^\\}\\);`, "m"));
  if (!match) throw new Error(`Cannot extract host icon ${name} from DSH_PRIMITIVES_JS`);
  return match[0];
}).join("\n") + `\nreturn { ${iconNames.join(", ")} };`;

const anchor = Date.parse("2026-09-10T10:24:00+08:00");
const dayMs = 86_400_000;
const events = [];
const modelDefinitions = [
  { provider: "deepseek", model: "deepseek-chat", share: 0.55 },
  { provider: "deepseek", model: "deepseek-reasoner", share: 0.28 },
  { provider: "demo-gateway", model: "example-model", share: 0.17 }
];
for (let offset = -185; offset <= 0; offset += 1) {
  const index = offset + 185;
  let tokens = index % 9 === 0 || index % 7 === 2 ? 0 : 18_000 + (index * 7919) % 170_000;
  if (offset >= -13 && offset < -6) tokens = [165_000, 192_000, 108_000, 220_000, 0, 186_000, 204_000][offset + 13];
  if (offset >= -6) tokens = [214_000, 341_000, 168_000, 402_000, 0, 517_000, 438_000][offset + 6];
  if (tokens === 0) continue;
  modelDefinitions.forEach(({ provider, model, share }, modelIndex) => {
    // Vary the model mix by day, while preserving the daily total.
    const mix = share + (modelIndex === 0 ? 1 : modelIndex === 1 ? -1 : 0) * ((index % 3) - 1) * 0.08;
    const modelTokens = Math.round(tokens * mix);
    const inputTokens = Math.round(modelTokens * 0.52);
    const outputTokens = Math.round(modelTokens * 0.20);
    const cacheReadTokens = Math.round(modelTokens * 0.25);
    events.push({
      time: anchor + offset * dayMs + modelIndex,
      data: {
        message: { source: { provider, model } },
        usage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens: modelTokens - inputTokens - outputTokens - cacheReadTokens }
      }
    });
  });
}
const billing = await collectBilling({
  get: (name) => name === "sessions" ? { list: () => [{ id: "readme-demo", snapshotEvents: () => events }] } : undefined
});
assert.equal(billing.total.tokens, billing.providers.reduce((sum, provider) => sum + provider.tokens, 0));
const providers = [
  {
    id: "deepseek-official", displayName: "DeepSeek", supported: true, configured: true,
    fetchedAt: anchor, balance: { remaining: 36.44, granted: 6.44, toppedUp: 30, currency: "CNY" }
  },
  { id: "demo-gateway", displayName: "Demo Gateway", supported: false, configured: true, balance: null }
];

const outputDir = join(root, "docs/images");
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {})
});
try {
  for (const dark of [false, true]) {
    const page = await browser.newPage({
      viewport: { width: 960, height: 944 }, deviceScaleFactor: 2,
      locale: "zh-CN", timezoneId: "Asia/Shanghai", reducedMotion: "reduce"
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    // Fulfill every request locally: no host server, account or network needed.
    await page.route("**/*", async (route) => {
      assert.equal(route.request().url(), "http://usage-lite.test/");
      await route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html>
        <html lang="zh-CN"><head><meta charset="utf-8"><style>${themeCss}</style><style>
          html,body{margin:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif}
          body{background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary)}
          .preview-heading{position:absolute;top:32px;left:60px;right:60px;display:flex;align-items:baseline;justify-content:space-between}
          .preview-heading strong{font-size:19px;letter-spacing:-.4px;font-weight:650}
          .preview-heading span,.preview-caption{font-size:11px;color:var(--dsw-alias-label-tertiary)}
          #trigger{position:fixed;left:60px;bottom:38px;width:340px}
          .preview-caption{position:absolute;right:60px;bottom:58px}
          /* Expand the scroll area for a complete documentation preview. */
          body .dul_panel{position:absolute;left:60px;top:96px;bottom:auto;max-height:none}
        </style></head><body${dark ? " data-ds-dark-theme" : ""}>
          <div class="preview-heading"><strong>dsh-usage-lite</strong><span>账户余额 · 本地用量 · 模型趋势</span></div>
          <div id="trigger"></div><div class="preview-caption">完整内容预览 · 示例数据</div>
        </body></html>` });
    });
    await page.goto("http://usage-lite.test/");
    await page.addScriptTag({ content: reactUmd });
    await page.addScriptTag({ content: reactDomUmd });
    await page.evaluate(({ source, iconSource, providers, billing }) => {
      const React = window.React;
      const jsx = (type, props, key) => React.createElement(type, key === undefined ? props : { ...props, key });
      const jsxRuntime = { jsx, jsxs: jsx, Fragment: React.Fragment };
      const primitives = new Function("jsx", "jsxs", iconSource)(jsx, jsx);
      let entry;
      window.__ModuleLoader__ = { load: (module) => { entry = module; } };
      new Function(source)();
      const modules = { react: React, "react/jsx-runtime": jsxRuntime, "react-dom": window.ReactDOM, "@deepseek-ai/dsh-client-ui-primitives": primitives };
      const client = entry.factory((name) => {
        if (!(name in modules)) throw new Error(`Unexpected module: ${name}`);
        return modules[name];
      });
      let locale;
      client.apply({
        effect: (effect) => effect(),
        locale: { register: (_namespace, translations) => { locale = translations.zh; } },
        slots: { inject: () => {} }
      });
      window.fetch = async (path) => {
        if (path !== "/api/usage-lite/summary" && path !== "/api/usage-lite/detail") throw new Error(`Unexpected fetch: ${path}`);
        return { ok: true, json: async () => path.endsWith("/detail")
          ? { ok: true, providers, provider: providers[0], billing }
          : { ok: true, provider: providers[0] } };
      };
      window.ReactDOM.createRoot(document.getElementById("trigger")).render(React.createElement(client.UsageLitePanel, {
        wide: true, t: (key) => {
          if (!(key in locale)) throw new Error(`Missing translation: ${key}`);
          return locale[key];
        }
      }));
    }, { source, iconSource, providers, billing });
    await page.waitForFunction(() => document.querySelector(".dul_amount")?.textContent.includes("36.44"));
    await page.locator(".dul_badgeMain").click();
    await page.locator(".dul_panel").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const panelHeight = await page.locator(".dul_panel").evaluate((panel) => panel.getBoundingClientRect().height);
    await page.setViewportSize({ width: 960, height: Math.max(944, Math.ceil(panelHeight) + 224) });
    const layout = await page.evaluate(() => {
      const body = document.querySelector(".dul_body");
      const panel = document.querySelector(".dul_panel").getBoundingClientRect();
      const selected = document.querySelector(".dul_selectedDay").getBoundingClientRect();
      return {
        panelHeight: panel.height, contentHeight: body.scrollHeight, visibleHeight: body.clientHeight,
        selectedDayVisible: selected.bottom <= body.getBoundingClientRect().bottom,
        bars: document.querySelectorAll(".dul_barCol").length,
        weeks: document.querySelectorAll(".dul_heatmapWeek").length,
        modelColors: new Set([...document.querySelectorAll(".dul_barSeg")].map((node) => getComputedStyle(node).backgroundColor)).size
      };
    });
    assert.equal(layout.bars, 7);
    assert.equal(layout.weeks, 27);
    assert.equal(layout.modelColors, 3);
    assert.equal(layout.selectedDayVisible, true, "Preview must show the heatmap and selected-day totals without clipping");
    assert.deepEqual(errors, []);
    await page.mouse.move(950, 10);
    const path = join(outputDir, dark ? "usage-lite-preview-dark.jpg" : "usage-lite-preview.jpg");
    await page.screenshot({ path, type: "jpeg", quality: 92, animations: "disabled" });
    console.log(`${dark ? "dark" : "light"}: ${JSON.stringify(layout)} -> ${path}`);
    await page.close();
  }
} finally {
  await browser.close();
}
