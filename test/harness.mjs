// Headless-Chromium harness — serves the site locally with the *real* CSP from
// `_headers` and drives every page, per dev-standards §15. Exit 1 on any failure.
import { chromium } from "playwright";
import http from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 8099;
const REPO = "github.com/MichalAFerber/file-viewer.us";

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
const isFile = (p) => existsSync(p) && statSync(p).isFile();

const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let filePath = normalize(join(ROOT, p));
  try {
    // Pages serves /support from support.html — resolve extensionless paths the
    // same way, or every clean URL falls through to the 404 and the checks below
    // run against the wrong document. The `.html` sibling has to win over a
    // same-named *directory* too: `samples/` holds the sample files, and
    // `/samples` is samples.html, exactly as Pages resolves it.
    if (filePath.startsWith(ROOT) && !isFile(filePath) && isFile(filePath + ".html")) {
      filePath += ".html";
    }
    if (!filePath.startsWith(ROOT) || !isFile(filePath)) {
      filePath = join(ROOT, "404.html");
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

const results = [];
const check = async (name, fn) => {
  try { results.push([name, !!(await fn())]); } catch (e) { results.push([name, false, String(e)]); }
};
const go = async (path) => {
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(300);
};

// --------------------------------------------------------------- home page ---
await go("/");

await check("h1 present", () => page.locator("h1").count().then((n) => n >= 1));
await check("13+ viewer cards", () => page.locator(".card").count().then((n) => n >= 13));
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
await check("mobile nav discloses the links (§3)", async () => {
  await page.setViewportSize({ width: 767, height: 900 });
  const hidden = await page.locator(".sitenav").isVisible();
  await page.click("#navToggle");
  const shown = await page.locator(".sitenav").isVisible();
  const expanded = await page.getAttribute("#navToggle", "aria-expanded");
  await page.keyboard.press("Escape");
  return hidden === false && shown === true && expanded === "true";
});
await page.setViewportSize({ width: 1280, height: 900 });

// ------------------------------------------------- house chrome, every page ---
const PAGES = ["/", "/samples", "/credits", "/privacy", "/terms", "/support", "/does-not-exist"];

for (const path of PAGES) {
  await go(path);
  const label = path === "/does-not-exist" ? "404" : path;

  await check(`${label}: skip link`, () => page.locator("a.skip-link").count().then((n) => n === 1));
  await check(`${label}: header theme toggle (§1)`, () => page.locator("#themeToggle").count().then((n) => n === 1));

  // §1 (v2.33.0): the shared family nav is links + CTA + theme toggle. The
  // header carries no repo mark — that moved to the footer's brand column.
  await check(`${label}: header carries no repo mark (§1)`, () =>
    page.locator('.topbar a[href*="github.com"]').count().then((n) => n === 0));
  await check(`${label}: header nav has links + CTA (§1)`, async () =>
    (await page.locator(".sitenav a").count()) >= 3 && (await page.locator(".sitenav .nav-cta").count()) === 1);

  // The Octocat is a bordered button — mark plus the word GitHub — in the
  // footer's brand column, with an accessible name that does not depend on the
  // lettering rendering (§1).
  await check(`${label}: footer Octocat button -> repo (§1)`, async () => {
    const gh = page.locator(`.foot-brand a.foot-gh[href*="${REPO}"]`);
    if ((await gh.count()) !== 1) return false;
    const [text, name, box] = await Promise.all([
      gh.innerText(),
      gh.getAttribute("aria-label"),
      gh.boundingBox(),
    ]);
    return /GitHub/.test(text) && /GitHub/.test(name || "") && box.height >= 40;
  });

  // textContent, not innerText: the headings are uppercased in CSS, so the
  // rendered text never matches the label the standard names.
  await check(`${label}: footer columns Tools · Resources · About · Legal (§1)`, async () => {
    const headings = await page.locator(".foot-cols .fcol h2").allTextContents();
    const tools = await page.locator(".foot-cols .fcol-tools").count();
    return tools === 1 && ["Resources", "About", "Legal"].every((h) => headings.includes(h));
  });

  // Every page, not just the home page: /support added a two-column field grid,
  // which is exactly the kind of thing that overflows the mobile tier.
  await check(`${label}: no horizontal overflow at the mobile tier (§3)`, async () => {
    await page.setViewportSize({ width: 767, height: 900 });
    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    await page.setViewportSize({ width: 1280, height: 900 });
    return ok;
  });

  await check(`${label}: footer credit exact, year rendered (§1)`, async () => {
    const credit = page.locator(".foot-credit");
    if ((await credit.count()) !== 1) return false;
    const text = await credit.innerText();
    const year = new Date().getFullYear();
    return text.includes("❤️")
      && text.includes(`© ${year} | Created with ❤️ by Michal Ferber, aka TechGuyWithABeard.`)
      && (await credit.locator('a[href="https://michalferber.dev/"]').count()) === 1
      && (await credit.locator('a[href="https://techguywithabeard.com/"]').count()) === 1;
  });
}

// ------------------------------------------------------------ support page ---
await go("/support");

await check("support: contact form fields (§6)", async () => {
  const form = page.locator("form#contact-form");
  if ((await form.count()) !== 1) return false;
  for (const field of ["name", "email", "subject", "message"]) {
    if ((await form.locator(`[name="${field}"]`).count()) !== 1) return false;
  }
  return (await form.locator(".cf-turnstile").count()) === 1
    && (await form.locator("#contact-status[aria-live]").count()) === 1;
});

// The family shares one support page (@wizard/ui SupportPage.astro) and one set
// of status strings. This site reimplements both — no build step, no component
// layer — so the wording is asserted rather than assumed. Divergence here is
// what the owner caught by eye on the first pass.
await check("support: family page structure and status wording (§1)", async () => {
  const FAMILY = [
    "Need help? We're here to assist you.",
    "Before you write",
    "Send a message",
    "Prefer GitHub?",
    "protected by Cloudflare\n      Turnstile, no account required.".replace(/\s+/g, " "),
  ];
  const body = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  const missingCopy = FAMILY.filter((s) => !body.includes(s.replace(/\s+/g, " ")));
  if (missingCopy.length) console.log("  missing family copy: " + missingCopy.join(" | "));

  const src = await readFile(join(ROOT, "support.html"), "utf8");
  const STATUS = [
    "Thanks — your message is on its way. We'll be in touch.",
    "Please fill in your name, email, and message.",
    "Please complete the verification challenge.",
    "Sending…",
    "Network error — please email ",
  ];
  const missingStatus = STATUS.filter((s) => !src.includes(s));
  if (missingStatus.length) console.log("  status wording differs from wizard-web: " + missingStatus.join(" | "));

  return missingCopy.length === 0 && missingStatus.length === 0;
});

// The slug rides in a variable, as it does in @wizard/ui, so host and slug are
// asserted separately. `file_viewer_us` is the registry row that already exists
// for this domain — a second row would fork contact_to, from_addr and the notify
// route away from the one the monitoring config already points at.
await check("support: posts to the house mailer, nothing else (§6)", async () => {
  const html = await readFile(join(ROOT, "support.html"), "utf8");
  const host = /https:\/\/mailer\.thompsonblack\.us\/contact\/\$\{product\}/.test(html);
  const slug = /const product = 'file_viewer_us';/.test(html);
  if (!host) console.log("  contact endpoint is not the house mailer");
  if (!slug) console.log("  registry slug is not file_viewer_us");
  return host && slug && !/forwardemail|smtp|nodemailer/i.test(html);
});

// Cloudflare's test keys (1x…/2x…/3x…) always pass, always block, or force a
// challenge client-side without touching the real widget. They are the right
// thing to develop against and the wrong thing to ship: the widget looks healthy
// and every submission dies at siteverify, which reads like a mailer outage.
await check("support: real Turnstile site key, not a test key (§7)", async () => {
  const html = await readFile(join(ROOT, "support.html"), "utf8");
  const m = html.match(/data-sitekey="([^"]+)"/);
  if (!m) { console.log("  no data-sitekey on the Turnstile widget"); return false; }
  if (/^[123]x0{20}[A-Z]{2}$/.test(m[1])) { console.log(`  test site key shipped: ${m[1]}`); return false; }
  return true;
});

await check("support: publishes support@, never contact_to (§6)", async () => {
  const body = await page.locator("main").innerText();
  return body.includes("support@file-viewer.us") && !/michal@file-viewer\.us/.test(body);
});

// ------------------------------------------------------------- source scans ---
const htmlFiles = (await readdir(ROOT)).filter((f) => f.endsWith(".html"));

// The house chrome is duplicated across pages on purpose — no build step, no
// component layer, so the copies ARE the mechanism (§1 makes the same argument
// for the Octocat path). Duplication only works if it stays duplication, so the
// blocks are compared byte for byte; this is the check that catches a fix
// applied to one page and forgotten on the other six.
await check("house chrome is byte-identical across pages (§1)", async () => {
  const BLOCKS = [
    ["header", "  <!-- House header (DS §1)", "  </div>\n"],
    ["footer", "  <!-- House footer (DS §1", "  </footer>\n"],
    ["script", "  <!-- House chrome behaviour", "  </script>\n"],
    ["header css", "    /* ---------- House header (DS §1) ----------", "\n      #navToggle { display: none; }\n    }\n"],
    ["footer css", "    /* ---------- House footer (DS §1, product-site variant) ----------", "      .fcol-tools { display: block; }\n    }\n"],
  ];
  let ok = true;
  for (const [name, open, close] of BLOCKS) {
    const seen = new Map();
    for (const f of htmlFiles) {
      const src = await readFile(join(ROOT, f), "utf8");
      const i = src.indexOf(open);
      if (i < 0) { console.log(`  ${f}: no ${name} block`); ok = false; continue; }
      const j = src.indexOf(close, i);
      if (j < 0) { console.log(`  ${f}: unterminated ${name} block`); ok = false; continue; }
      const body = src.slice(i, j + close.length);
      if (!seen.has(body)) seen.set(body, []);
      seen.get(body).push(f);
    }
    if (seen.size > 1) {
      ok = false;
      console.log(`  ${name} has drifted into ${seen.size} variants:`);
      for (const files of seen.values()) console.log(`    ${files.join(", ")}`);
    }
  }
  return ok;
});

// §1 contact surface: no mailto: on any page. security.txt is the sole exception
// (RFC 9116 requires a Contact: URI) and is not an HTML page, so it is out of scope.
await check("no mailto: links in any page (§1)", async () => {
  const offenders = [];
  for (const f of htmlFiles) {
    if (/mailto:/.test(await readFile(join(ROOT, f), "utf8"))) offenders.push(f);
  }
  if (offenders.length) console.log("  mailto: found in " + offenders.join(", "));
  return offenders.length === 0;
});

// Family rule (owner ruling 2026-08-07, carried by @wizard/ui's PrivacyPage and
// TermsPage): the legal pages name NO email address at all — every contact route
// is the /support contact form. The support page itself still publishes
// support@ per §6; this check is scoped to privacy and terms.
await check("privacy/terms route contact through /support, no address (§1)", async () => {
  const ADDRESS = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const offenders = [];
  for (const f of ["privacy.html", "terms.html"]) {
    const src = await readFile(join(ROOT, f), "utf8");
    const body = src.slice(src.indexOf('<main class="legal"'));
    const m = body.match(ADDRESS);
    if (m) offenders.push(`${f} (${m[0]})`);
    if (!/href="\/support"/.test(body)) offenders.push(`${f} (no /support link)`);
  }
  if (offenders.length) console.log("  " + offenders.join(", "));
  return offenders.length === 0;
});

// §1: the credit year MUST NOT be a literal — it goes stale silently on Jan 1.
await check("no literal copyright year in any page (§1)", async () => {
  const offenders = [];
  for (const f of htmlFiles) {
    const src = await readFile(join(ROOT, f), "utf8");
    if (/(&copy;|©)\s*\d{4}/.test(src)) offenders.push(f);
  }
  if (offenders.length) console.log("  literal year in " + offenders.join(", "));
  return offenders.length === 0;
});

// External-resource network failures (e.g. the analytics script offline) are allowed;
// CSP violations are worded differently ("Refused to...") and still fail this check.
const ALLOW = [/plausible/i, /thompsonblack/i, /challenges\.cloudflare\.com/i, /turnstile/i,
  /net::ERR/i, /Failed to load resource/i];
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
