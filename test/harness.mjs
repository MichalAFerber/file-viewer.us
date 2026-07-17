// Headless-Chromium harness — serves the site locally with the *real* CSP from
// `_headers` and drives index.html, per dev-standards §15. Exit 1 on any failure.
import { chromium } from "playwright";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 8099;

// --- read the security headers (incl. CSP) from _headers and apply them like Pages ---
const headerText = await readFile(join(ROOT, "_headers"), "utf8");
const SECURITY_HEADERS = {};
for (const line of headerText.split("\n")) {
  const m = line.match(/^[ \t]+([A-Za-z0-9-]+):[ \t]*(.+?)\s*$/);
  if (m && !line.trim().startsWith("#")) SECURITY_HEADERS[m[1]] = m[2];
}
if (!SECURITY_HEADERS["Content-Security-Policy"]) {
  console.error("FAIL: no Content-Security-Policy found in _headers");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".xml": "application/xml", ".txt": "text/plain",
};
const mime = (p) => MIME[p.slice(p.lastIndexOf("."))] || "application/octet-stream";

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let filePath = normalize(join(ROOT, p));
  try {
    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
      filePath = join(ROOT, "index.html"); // SPA-style 200 fallback (mirrors Pages)
    }
    const body = await readFile(filePath);
    res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": mime(filePath) });
    res.end(body);
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(400);

const results = [];
const check = async (name, fn) => { try { results.push([name, !!(await fn())]); } catch (e) { results.push([name, false, String(e)]); } };

await check("h1 present", () => page.locator("h1").count().then((n) => n >= 1));
await check("13+ viewer cards", () => page.locator(".card").count().then((n) => n >= 13));
await check("skip link", () => page.locator("a.skip-link").count().then((n) => n === 1));
await check("header theme toggle", () => page.locator("#themeToggle").count().then((n) => n === 1));
await check("header octocat -> hub repo", () =>
  page.locator('.topbar a[href*="github.com/MichalAFerber/file-web-viewer"]').count().then((n) => n >= 1));
await check("JetBrains Mono on h1 (font loaded under CSP)", async () => {
  await page.evaluate(() => document.fonts.ready);
  const ff = await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily);
  return /JetBrains Mono/i.test(ff);
});
await check("toggle switches theme + persists", async () => {
  const before = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  await page.click("#themeToggle");
  const after = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const saved = await page.evaluate(() => { try { return localStorage.getItem("fv-theme"); } catch (e) { return null; } });
  return before !== after && (after === "light" || after === "dark") && saved === after;
});

// External-resource network failures (e.g. the analytics script offline) are allowed;
// CSP violations are worded differently ("Refused to...") and still fail this check.
const ALLOW = [/plausible/i, /thompsonblack/i, /net::ERR/i, /Failed to load resource/i];
const realErrors = consoleErrors.filter((e) => !ALLOW.some((re) => re.test(e)));
await check("no unexpected console/CSP errors", () => realErrors.length === 0);

await browser.close();
server.close();

let failed = 0;
for (const [name, ok, err] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${err ? "  — " + err : ""}`);
  if (!ok) failed++;
}
if (realErrors.length) console.log("Unexpected errors:\n  " + realErrors.join("\n  "));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
