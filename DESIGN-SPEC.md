# File Viewer Kit — Design & Build Spec

A single, agent-ready specification for the **File Viewer family of single-file
web viewers** ([file-viewer.us](https://file-viewer.us/)). Use it to (a) build a
brand-new viewer green-field, or (b) bring an existing viewer up to parity with
**html-viewer** (the reference implementation).

> **Status (2026-07):** all six family sites are built and live. Since v1 the
> shared shell gained a **SEO / Open-Graph kit** (§7.1), a **collapse-to-handle
> auto-hiding header** (§6.6), **site-favicon nav icons** (§6.9), and several
> parity fixes — a compact centered empty card, `html,body{overflow-x:clip}`, a
> footer-close specificity fix, and a header-padding media query. This doc
> reflects the current shell. (The `mykk-bg` storage key is unchanged.)
> **2026-08:** the shell gains a **family router** (§6.10) — a wrong-viewer
> redirect offer with an in-browser `postMessage` file hand-off; its canonical
> data lives in `family-map.json` in this repo.

> **Reference implementation:** [`MichalAFerber/html-web-viewer`](https://github.com/MichalAFerber/html-web-viewer)
> → `index.html`. When this spec says "copy verbatim from the reference," it
> means that file. Everything here is derived from it.

---

## 0. TL;DR for the implementing agent

1. Every viewer is **one self-contained `index.html`** — no build step, no
   framework, no external runtime dependencies. Libraries are **minified and
   pasted inline**. It must work fully offline, even from `file://`.
2. There is **one shared "shell"** (design tokens, top bar, family hamburger
   nav, footer, color picker, drop zone, toast, the **collapse-to-handle
   auto-hiding header** §6.6, the **family router** §6.10, the **SEO/OG kit**
   §7.1, analytics, security headers) that is **identical** across viewers.
   Copy it verbatim.
3. Each viewer supplies a small **adapter**: its identity (title, domain,
   favicon, repo), its **accepted file types** (listed in the empty-state
   sub-line), and how it turns a file into a **rendered view** (and, for text
   files, a **source view**).
4. Ship the sidecar files (`_headers`, `og.png`, `apple-touch-icon.png`,
   `robots.txt`, `sitemap.xml`, `README.md`, `LICENSE`, `.gitignore`), deploy to
   **Cloudflare Pages** on `main`, and register the domain in **Plausible**.
5. **Verify with the headless-Chromium harness** (§12) under the real CSP
   before opening a PR. Parity = the checklist in §13 passes.

---

## 1. The viewer family

| Viewer | Repo (`MichalAFerber/…`) | Domain | Favicon (vscode-icons `icons/…`) | `<title>` / base title |
| --- | --- | --- | --- | --- |
| **html** | `html-web-viewer` ✅ | `html-viewer.us` | `file_type_html.svg` | `HTML Viewer` |
| **markdown** | `markdown-web-viewer` ✅ | `markdown-viewer.us` | `file_type_markdown.svg` | `Markdown Viewer` |
| **epub** | `epub-web-viewer` ✅ | `epub-viewer.us` | `file_type_epub.svg` | `EPUB Viewer` |
| **pdf** | `pdf-web-viewer` ✅ | `pdf-viewer.us` | **compact** custom PDF mark † | `PDF Viewer` |
| **data** | `data-web-viewer` ✅ | `data-viewer.us` | `file_type_db.svg` | `Data Viewer` |
| **docx** | `docx-web-viewer` ✅ | `docx-viewer.us` | `file_type_word.svg` | `DOCX Viewer` |
| **sheets** | `sheets-web-viewer` ✅ | `sheets-viewer.us` | `file_type_excel.svg` | `Sheets Viewer` |
| **eml** | `eml-web-viewer` ✅ | `eml-viewer.us` | ✉️ custom envelope | `EML Viewer` |
| **pptx** | `pptx-web-viewer` ✅ | `pptx-viewer.us` | `file_type_powerpoint.svg` | `PPTX Viewer` |
| **log** | `log-web-viewer` ✅ | `log-viewer.us` | custom terminal | `Log Viewer` |
| **cert** | `cert-web-viewer` ✅ | `cert-viewer.us` | custom shield | `Cert Viewer` |
| **pub** | `pub-web-viewer` ✅ | `pub-viewer.us` | custom publication | `PUB Viewer` |
| **file** *(hub)* | `file-web-viewer` ✅ | `file-viewer.us` | 🗂️ folder emoji (SVG `<text>`) | `File Viewer` |

† vscode-icons' `file_type_pdf.svg` is ~46 KB — too heavy to inline (and to reuse
in every viewer's nav). pdf-viewer uses a **compact ~0.5 KB** red document mark
instead; that's also the icon used for the **PDF** item in the family nav.

Both **docx** (docx-preview + JSZip) and **sheets** (SheetJS community) shipped
in 2026-07 — see §17 for the library audit, CSP notes, and legacy-format caveats
(`.doc/.rtf/.odt` render an accept-with-notice card; `.xls` is fully supported).
**Roadmap candidates** (considered, not yet built) are catalogued in §17.1.

The **hub** (`file-viewer.us`) is the family home: a single-page landing site
with a **card per viewer** (icon, name, description, accepted types → link). It
uses the shared shell chrome (tokens, color picker, footer) but has **no file
machinery and no hamburger nav** — it *is* Home. This repo also holds the shared
design/template files (this spec). See §16.

**Favicon source:** `https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons/<file>` — fetch it, then inline it as a `data:image/svg+xml,<url-encoded-svg>` URI (see §7). The **same** data URI is used for the `<link rel="icon">` **and** the header brand icon.

**Accepted file types (authoritative — each type belongs to exactly one viewer; no overlap):**

- **html:** `.html .htm .xhtml .xht .shtml .shtm .stm .hta .mhtml .mht .css .scss .sass .less .styl .pcss .postcss .js .mjs .cjs .jsx .ts .mts .cts .tsx .coffee .htaccess .htpasswd .env .ini .conf .webmanifest .map .php .phtml .asp .aspx .ascx .cshtml .vbhtml .jsp .jspx .cfm .erb .rhtml .ejs .hbs .handlebars .mustache .njk .liquid .jinja .j2 .twig .pug .jade .haml .slim .vue .svelte .astro` + exact names `robots.txt`
- **markdown:** `.md .markdown .mdx .txt .rst .adoc`
- **epub:** `.epub`
- **pdf:** `.pdf`
- **data:** `.json .jsonc .json5 .jsonld .ndjson .yaml .yml .toml .csv .tsv .xml .rss .atom .graphql .gql`
- **docx:** `.docx .docm .dotx .dotm` rendered; `.doc .dot .rtf .odt` accepted-with-notice
- **sheets:** `.xlsx .xlsm .xlsb .xls .xlt .xltx .xltm .xlam .ods .fods .dif .prn .dbf .numbers` *(CSV/TSV stay with **data** — no overlap)*

> The list above predates the 2026-07 viewers. The **full 13-viewer map** —
> including eml, pptx, log, cert, pub, and image — is canonical in
> **`family-map.json`** (this repo) and mirrored as `FAMILY_MAP` in §6.10.
> One known as-built exception to "no overlap": both markdown and log accept
> `.txt`; **markdown owns it for routing** (§6.10). Note also that
> image-viewer.us shipped after the §1 table was last updated, and the repos
> were renamed 2026-07-30 to match their domains (the hub repo is now
> `MichalAFerber/file-viewer.us`; older sections still say `file-web-viewer` /
> `<fmt>-web-viewer`).

**Shared constants (identical everywhere):**

- Analytics tag (in `<head>`, `defer`):
  `<script defer data-domain="<domain>" src="https://plausible.thompsonblack.us/js/script.js"></script>`
- GitHub link (header, opens in new tab): `https://github.com/MichalAFerber/<type>-web-viewer`
- Footer credit (verbatim): `© 2026 | Created with ❤️ by [Michal Ferber](https://michalferber.dev), aka [TechGuyWithABeard](https://techguywithabeard.com)`
- Background-color storage key: `mykk-bg` (cookie + `localStorage`).
- Title format: filename in the bar while viewing; base title (e.g. `Data Viewer`) on the empty screen and after a file’s name (`doc.title = name ? name + " — " + BASE : BASE`).

---

## 2. Architecture & non-negotiables

- **Single file.** All HTML, CSS, JS, and third-party libraries live in
  `index.html`. No bundler, no `npm install` to run it, no network calls at
  runtime except the Plausible tag (and, in the **rendered** plane only,
  whatever assets the viewed content itself references — see §9).
- **Vanilla JS**, wrapped in one IIFE, `"use strict"`, ES5-compatible style
  (`var`, `function`). No frameworks.
- **Libraries are inlined**, minified, with their license banner retained
  directly above the code. To bundle one: fetch the minified UMD/browser build,
  confirm it contains **no `eval` / `new Function`** (so it runs under the CSP),
  and paste it inside its own `<script>` element. (Reference technique: write a
  placeholder `<script>/*__LIB__*/</script>`, then string-replace the marker
  with the file contents; never hand-paste 100 KB.)
- **Offline-first & `file://`-safe.** Test by opening the file directly.
- **Accessibility & mobile are first-class** (see §11). Safe-area insets,
  `100dvh`, `prefers-reduced-motion`, `prefers-color-scheme`.

Sidecar files (all viewers): `index.html`, `_headers`, `README.md`, `LICENSE`,
`.gitignore` (see §14).

---

## 3. Two planes: Rendered vs Source

Every viewer presents a file in up to two "planes":

- **Rendered plane** — *viewer-specific*. HTML → sandboxed iframe; Markdown →
  sanitized HTML; EPUB → paginated chapters; PDF → canvas pages; Data → pretty
  tree / table.
- **Source plane** — *shared*. The raw text in a syntax-highlighted, line-
  numbered code view (highlight.js). Only for **text** files.

| Viewer | Rendered plane | Source plane | `</>` toggle | `{ }` Format |
| --- | --- | --- | --- | --- |
| html | sandbox iframe | ✅ | ✅ | ✅ |
| markdown | sanitized HTML | ✅ | ✅ | (optional) |
| data | pretty tree/table | ✅ | ✅ | ✅ (pretty-print) |
| epub | paginated render | ❌ (binary) | ❌ | ❌ |
| pdf | canvas render | ❌ (binary) | ❌ | ❌ |

Rules:
- If a file has **both** planes, show a `</>` **View toggle** in the header
  (icon flips between "code" `</>` and "eye"). Text-only files (no meaningful
  render) open **directly in the Source plane** and the toggle is hidden.
- The **Format `{ }` toggle** appears only in the Source plane, only for
  formattable types (see §6.8).
- **Binary viewers** (epub, pdf) have a Rendered plane only — no toggle, no
  Format — but they still get the **entire shell** (header, footer, color
  picker theming the chrome, drop zone, validation, analytics, scroll header).

---

## 4. Design tokens (copy verbatim)

All color/spacing decisions flow from CSS custom properties on `:root`. The
palette is **runtime-adaptive**: the user picks any background color and every
other token is derived from it (§5). Ship these defaults:

```css
:root{
  --bg:#ffffff; --surface:#ffffff; --header-bg:rgba(255,255,255,.9);
  --text:#1f2328; --muted:#656d76; --border:#d0d7de; --border-soft:#e5e7eb;
  --accent:#4f46e5; --accent-contrast:#ffffff;
  --code-bg:#f6f8fa; --code-text:#1f2328; --hover:#f3f4f6;
  --overlay:rgba(79,70,229,.10); --shadow:rgba(0,0,0,.12);
  --hdr-h:56px;   /* measured at runtime; source view offsets by this */
  /* Syntax highlighting (light-bg palette; overridden for dark in JS) */
  --hl-comment:#6e7781; --hl-keyword:#cf222e; --hl-tag:#116329; --hl-attr:#0550ae;
  --hl-string:#0a3069; --hl-number:#0550ae; --hl-title:#8250df; --hl-built:#953800;
}
```

- **Accent** is indigo `#4f46e5` on light, `#8b93ff` on dark.
- **Type:** system stack, `line-height:1.55`, `-webkit-font-smoothing:antialiased`.
- **Radii:** buttons `9px`, cards `16–20px`, small chips `6px`.
- **Spacing:** header padding `.55rem .75rem` (+`env(safe-area-inset-top)`);
  content max-width for prose planes `~54rem`.

---

## 5. Adaptive color system (copy verbatim — this is the signature)

A native `<input type="color">` swatch in the header lets the user choose any
background. `applyColor(hex)` derives a fully legible, contrast-correct theme
(light **or** dark) from that one value, including syntax-token colors. The
choice persists in a cookie with a `localStorage` fallback (works on `file://`).

```js
function hexToRgb(h){
  h = h.replace("#","");
  if (h.length===3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n = parseInt(h,16); return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function srgb(c){ c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }
function luminance(rgb){ return 0.2126*srgb(rgb.r)+0.7152*srgb(rgb.g)+0.0722*srgb(rgb.b); }
function mix(a,b,t){ return "rgb("+Math.round(a.r+(b.r-a.r)*t)+","+Math.round(a.g+(b.g-a.g)*t)+","+Math.round(a.b+(b.b-a.b)*t)+")"; }
function rgbStr(c){ return "rgb("+c.r+","+c.g+","+c.b+")"; }

var HL_LIGHT = { comment:"#6e7781", keyword:"#cf222e", tag:"#116329", attr:"#0550ae", string:"#0a3069", number:"#0550ae", title:"#8250df", built:"#953800" };
var HL_DARK  = { comment:"#8b949e", keyword:"#ff7b72", tag:"#7ee787", attr:"#79c0ff", string:"#a5d6ff", number:"#79c0ff", title:"#d2a8ff", built:"#ffa657" };

function applyColor(hex){
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) hex = "#ffffff";
  var bg = hexToRgb(hex);
  var lightText = luminance(bg) <= 0.179;            // dark bg -> light text (crossover ~0.179)
  var text = lightText ? {r:240,g:243,b:246} : {r:31,g:35,b:40};
  var accentHex = lightText ? "#8b93ff" : "#4f46e5";
  var ac = hexToRgb(accentHex), hl = lightText ? HL_DARK : HL_LIGHT, s = document.documentElement.style;
  s.setProperty("--bg",hex); s.setProperty("--surface",hex);
  s.setProperty("--text",rgbStr(text)); s.setProperty("--code-text",rgbStr(text));
  s.setProperty("--muted",mix(bg,text,0.45)); s.setProperty("--border",mix(bg,text,0.24));
  s.setProperty("--border-soft",mix(bg,text,0.13)); s.setProperty("--code-bg",mix(bg,text,0.07));
  s.setProperty("--hover",mix(bg,text,0.10)); s.setProperty("--accent",accentHex);
  s.setProperty("--accent-contrast", lightText ? "#0d1117" : "#ffffff");
  s.setProperty("--overlay","rgba("+ac.r+","+ac.g+","+ac.b+",0.12)");
  s.setProperty("--shadow", lightText ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.12)");
  s.setProperty("--header-bg","rgba("+bg.r+","+bg.g+","+bg.b+",0.9)");
  s.setProperty("--hl-comment",hl.comment); s.setProperty("--hl-keyword",hl.keyword);
  s.setProperty("--hl-tag",hl.tag); s.setProperty("--hl-attr",hl.attr);
  s.setProperty("--hl-string",hl.string); s.setProperty("--hl-number",hl.number);
  s.setProperty("--hl-title",hl.title); s.setProperty("--hl-built",hl.built);
  s.colorScheme = lightText ? "dark" : "light";
  document.getElementById("themeColor").setAttribute("content", hex);   // <meta name=theme-color>
}
```

Persistence (verbatim): `setCookie("mykk-bg", val)` (`max-age=31536000; path=/; SameSite=Lax`) **and** `localStorage.setItem("mykk-bg", val)`; `loadColor()` reads cookie first, falls back to `localStorage`, defaults `#ffffff`. Wire `bgPicker.addEventListener("input", …)` to apply + save.

> Viewers whose **rendered plane** is a document (PDF/EPUB/HTML page) keep that
> canvas visually neutral (white/paper). The chosen color themes the **chrome**
> (header, footer, empty state) and the **Source plane**. Don’t tint a rendered
> document with the chrome color.

---

## 6. Component inventory (shared shell)

Reproduce these exactly (copy from the reference `index.html`). Selectors and
behavior are contractual — the acceptance harness keys off these IDs/classes.

### 6.1 App shell / layout
- `body` is a flex column, `min-height:100dvh`. When a file is open, add class
  `viewing`; `body.viewing{ height:100dvh; overflow:hidden }` so the app fills
  the viewport and the **panes scroll internally** (keeps the code scrollbar
  reachable and lets the header react to scroll in either plane).
- `<a class="skip" href="#main">Skip to content</a>` (visible on focus).
- `<div class="hover-zone" id="hoverZone">` — a fixed 24px strip at the very top
  (only while `viewing`) used to reveal the header.

### 6.2 Top bar `.topbar` (IDs: `#brandIcon`, `#docTitle`, `.actions`)
`position:sticky` in the empty state; becomes `position:fixed` while `viewing`
(so it can slide away — §6.6). Layout, left→right:
`[brand-icon 24px] [doc-title flex:1, ellipsis] [actions …]`.
- **Empty screen:** brand icon + base title, **and the action buttons are still
  visible** (do **not** hide `.actions`).
- **Viewing:** brand icon + filename + actions.

### 6.3 Icon buttons `.iconbtn`
40×40, transparent, `border-radius:9px`, 21px stroked SVG (`currentColor`,
`fill:none`, `stroke-width:2`). `:hover{background:var(--hover)}`,
`:active{transform:scale(.92)}`, `:focus-visible{outline:2px solid var(--accent)}`.
Active/toggled state: `.iconbtn.active{ color:var(--accent); background:var(--overlay) }`.
Standard buttons (in order): **View `</>`** (if two planes), **Format `{ }`**
(source plane, formattable), **Copy**, **Clear**, **color swatch**, **GitHub**.
(The old "New `+`" button was removed — do not add it.)

### 6.4 Fast tooltips `.tip[data-tip]`
Native `title` is too slow. Use a CSS tooltip: `.tip{position:relative}` +
`.tip::after{ content:attr(data-tip); position:absolute; top:calc(100% + 7px);
right:0; … opacity:0; transition:opacity .1s ease .1s }`, shown on
`:hover`/`:focus-visible`. Variant `.tip-up` renders above (footer). Suppress on
touch: `@media (hover:none){ .tip::after{content:none} }`. Keep real
`aria-label`s on the controls. **Inputs can’t host `::after`** — wrap the color
input in `<span class="swatch-wrap tip" data-tip="Background color">`.

### 6.5 Color swatch — native `<input type="color" class="swatch">` styled round
(`::-webkit-color-swatch{border-radius:50%}`, etc.).

### 6.6 Auto-hiding header → collapse-to-handle (copy verbatim)
While the **rendered** plane is open, the header **shows on open, then auto-hides
after 3 s** of no interaction — collapsing to a **thick tappable "handle"** (a
short accent line with a center grabber) that sits over the content. **Hover,
touch, tap the handle, or scroll up** brings the full header back (and re-arms
the 3 s). The **source** plane *keeps* the header (its content is laid out
below it, so hiding would leave a gap): `hideHeader()` is a no-op there.

The header still slides fully off-screen via `translateY(-118%)`; what makes it
read as "shrinking to a line" is the **hover-zone** (`#hoverZone`, a ~22 px
transparent top strip that catches hover/tap) rendering a visible bar **only when
collapsed**. The zone sits at `z-index:35`, *below* the topbar (`z-36`), so the
topbar covers it when shown and it's exposed (as the handle) when the topbar is
translated away.

```js
var HDR_IDLE_MS = 3000, HDR_THRESH = 6, hdrIdleTimer = null;
var lastPos = { win:0, code:0, frame:0 };
function showHeader(){ body.classList.remove("hdr-hidden"); }
// only the rendered plane auto-hides (guard on the current mode, e.g. "preview"/"rendered"):
function hideHeader(){ if (body.classList.contains("viewing") && mode === RENDERED) body.classList.add("hdr-hidden"); }
function armIdleHide(){ clearTimeout(hdrIdleTimer); hdrIdleTimer = setTimeout(hideHeader, HDR_IDLE_MS); }
function revealHeader(){ showHeader(); armIdleHide(); }        // show now, collapse after 3 s
function onScroll(key, pos){
  if (!body.classList.contains("viewing")) return;
  var d = pos - lastPos[key]; lastPos[key] = pos;
  if (d > HDR_THRESH) hideHeader();            // down -> collapse
  else if (d < -HDR_THRESH) revealHeader();    // up   -> reveal, then auto-hide
}
window.addEventListener("scroll", function(){ onScroll("win", window.pageYOffset||0); }, {passive:true});
codeView.addEventListener("scroll", function(){ onScroll("code", codeView.scrollTop); }, {passive:true});
hoverZone.addEventListener("mouseenter", revealHeader);
hoverZone.addEventListener("click", revealHeader);
hoverZone.addEventListener("touchstart", function(){ revealHeader(); }, { passive:true });
topbar.addEventListener("mouseenter", function(){ showHeader(); clearTimeout(hdrIdleTimer); });  // stay up while hovered
topbar.addEventListener("mouseleave", function(){ armIdleHide(); });
// On file open, call revealHeader() for the rendered plane; showHeader()+clearTimeout for the source plane.
// Measure header height so the source pane clears the fixed bar:
function measureHeader(){ root.style.setProperty("--hdr-h", (topbar?topbar.offsetHeight:56)+"px"); }
measureHeader(); window.addEventListener("resize", measureHeader);
```

CSS (topbar + the handle rendered on the hover-zone when collapsed):
```css
body.viewing .topbar{ position:fixed; top:0; left:0; right:0; z-index:36; transition:transform .28s ease, box-shadow .28s ease; }
body.viewing.hdr-hidden .topbar{ transform:translateY(-118%); box-shadow:none }
.hover-zone{ display:none }
body.viewing .hover-zone{ display:block; position:fixed; top:0; left:0; right:0; height:22px; z-index:35; cursor:pointer }
body.viewing.hdr-hidden .hover-zone::before{ content:""; position:absolute; top:0; left:0; right:0; height:7px; background:var(--accent); box-shadow:0 1px 6px var(--shadow) }
body.viewing.hdr-hidden .hover-zone::after{ content:""; position:absolute; top:1.5px; left:50%; transform:translateX(-50%); width:46px; height:4px; border-radius:2px; background:var(--accent-contrast); opacity:.7 }
```
Notes: viewers whose hidden-class is `header-hidden` (markdown) or a `peek` model
(epub) adapt the class names but keep this behavior. If the rendered pane is a
**same-origin-readable** element/iframe you can observe its scroll to drive
this; otherwise it reacts to the window/source scroll only, which is fine.

### 6.7 Empty state / drop zone / full-screen overlay / toast
- `.empty` is a **compact, centered** drop card — `.empty` centers its child
  (`align-items:center; justify-content:center`) and `.empty-inner` is
  `max-width:30rem; width:100%` with the dashed border, glyph, title, sub-line.
  **Do NOT let it stretch full-screen** (`flex:1` / no `max-width` produces a
  giant edge-to-edge box — a fixed bug). Acts as an open button (click / Enter /
  Space → dialog).
- The **sub-line lists the accepted types**, e.g. `Drag & drop anywhere, paste,
  or tap to open. Accepts .json, .jsonc, .yaml, .csv, .tsv, .xml … & more.`
  Binary viewers drop "paste" (`Drag & drop anywhere or tap to open. Accepts
  .pdf — …`). Every viewer must show **its own** list.
- `.drop-overlay` covers the viewport during drag; its `.drop-card` is
  **full-screen** (dashed accent border filling the window minus a 12 px gutter).
  This is the *drag* overlay — distinct from the compact empty card above.
- `.toast` bottom-center, `role="status" aria-live="polite"`, auto-hides ~1.9 s.
- Footer `.footer` (`position:relative`) with the credit line and a far-right
  **× close** button (`#btnFooterClose`, hides footer for the session), styled
  `position:absolute; right:.5rem; top:50%; transform:translateY(-50%)`.
  ⚠️ If tooltips use `[data-tip]{position:relative}` and that rule is declared
  **after** `.footer-close`, it wins on equal specificity and knocks the button
  into normal flow (centered below the text). **Scope the position rule as
  `.footer .footer-close`** so it beats `[data-tip]`.
- **No horizontal scrollbar:** `html,body{overflow-x:clip}` so the off-screen
  (closed) flyout nav panel and the `left:-999px` skip link never create an
  h-scrollbar. (`overflow-x:clip` — not `hidden` — so `position:sticky` still works.)
- **Header padding parity:** `@media (min-width:640px){ .topbar{padding-left:1rem; padding-right:1rem} }` on every viewer, so header icons sit at the same insets.
- **Drop-to-replace (required):** the drag/drop + paste handlers live on
  `window` and call the loader, so **dropping a new file while one is already
  open replaces it** (drag anywhere, or paste). ⚠️ **Iframe caveat:** if the
  Rendered plane is an `<iframe>`, a drop *over the rendered area* goes to the
  iframe, not `window` — the browser then **opens the file in a new tab**
  instead of replacing. Because the frame is `allow-same-origin`, attach
  `dragenter/dragover/dragleave/drop` listeners to `iframe.contentDocument` too
  (in the `load` handler) and forward the file to the parent loader;
  `preventDefault` on `dragover` is what stops the browser default.

### 6.8 Source plane: code view + Format (for text viewers)
- Markup: `<div id="codeView" class="codewrap"><pre class="gutter" id="gutter"></pre><pre class="code"><code id="codeInner" class="hljs"></code></pre></div>`.
- **highlight.js** (common build, v11.9.0, BSD-3-Clause) inline. Highlight the
  verbatim text (it escapes + colorizes; whitespace preserved). Pick language by
  extension, else `highlightAuto`; cap highlighting at ~400 KB (fallback to
  escaped text). Map hljs token classes to the `--hl-*` variables.
- **Gutter:** one line number per `\n` (`display:flex`; gutter
  `position:sticky; left:0`); `.code{ white-space:pre }` with horizontal scroll.
  The source pane’s top padding is `calc(1rem + var(--hdr-h))` so the fixed
  header never covers line 1.
- **Format `{ }` toggle:** **js-beautify** (v1.15.1, MIT) inline — exposes
  `window.beautifier.{js,css,html}` (no `eval`, CSP-safe). Toggle pretty-prints
  the source on demand and flips back to raw; each file opens **raw**; Copy
  returns the beautified text when on. Show the button only in the source plane
  for formattable types. **Note in UI/README:** beautify fixes *layout* (great
  for minified) but cannot rename mangled identifiers in obfuscated code.

### 6.9 Family hamburger nav (every viewer; NOT the hub)
A **☰ button at the far left of the header** (before the brand icon) opens a
**left flyout sidebar** linking the whole family. Same on every viewer; each
marks **its own** item active.

- Order & targets: **Home** → `file-viewer.us`, **HTML** → `html-viewer.us`,
  **Markdown** → `markdown-viewer.us`, **ePUB** → `epub-viewer.us`,
  **Data** → `data-viewer.us`, **PDF** → `pdf-viewer.us`. Each item's icon is
  **that destination site's actual favicon**, rendered as
  `<img class="nav-ico" src="data:image/svg+xml,…" alt="" aria-hidden="true">`
  (Home = the hub's 🗂️ folder-emoji favicon; PDF = the compact PDF mark), + a
  label; the current site gets `class="nav-active" aria-current="page"`.
  `.nav-ico` is `width:20px;height:20px;flex:0 0 auto;border-radius:4px`. Because
  these are `<img>` in the body, the CSP **`img-src` must allow `data:`** (it
  does on every viewer). The menu markup is **byte-identical** across viewers —
  only the active item differs.
- Markup: `#btnMenu` (`.tip.tip-l`, `aria-expanded`, `aria-controls="navPanel"`)
  + `#navBackdrop.nav-backdrop` + `<aside id="navPanel" class="nav-panel">`.
- Behavior (copy verbatim): toggle `body.nav-open`; the panel slides in from the
  left (`transform:translateX(0)` + `visibility`), a backdrop fades in; close on
  backdrop click or **Escape**. Panel `z-index` sits above the header.
  ```js
  var btnMenu = id("btnMenu"), navBackdrop = id("navBackdrop");
  function setNav(open){ body.classList.toggle("nav-open", open); btnMenu.setAttribute("aria-expanded", open ? "true" : "false"); }
  btnMenu.addEventListener("click", function(){ setNav(!body.classList.contains("nav-open")); });
  navBackdrop.addEventListener("click", function(){ setNav(false); });
  doc.addEventListener("keydown", function(e){ if (e.key === "Escape") setNav(false); });
  ```
- Left-anchor the menu button's tooltip so it doesn't run off-screen: a
  **`.tip-l`** variant (`right:auto; left:0`) for the class-based tooltip (html),
  or `#btnMenu[data-tip]::after{left:0; transform:none}` for the attribute-based
  system (markdown / epub / data / pdf).
- The **hub** (`file-viewer.us`) does **not** include this — it shows the cards.

### 6.10 Family router — wrong-viewer redirect offer + in-browser file hand-off

When a dropped / pasted / picked file fails a viewer's own accept gate, don't
dead-end at the rejection toast. If the extension belongs to a **sibling
viewer**, show an **offer card** — and, if the user accepts, open that viewer in
a new tab and **hand the `File` across inside the browser** so they don't have
to drop it a second time. Accepted files never touch this code path; a file the
viewer already handles behaves exactly as before.

> **Decision record — no server relay.** An upload-to-a-Worker relay (stash the
> file, redirect with a token, target pulls it down) was considered and
> **rejected**: it would falsify the published promise on every page ("files
> never leave your device" — hero, READMEs, privacy pages, notice cards; §9's
> "No uploads" rule), require loosening `connect-src` in all 14 CSPs, and stand
> up an unauthenticated upload endpoint (abuse surface, cost, liability). The
> hand-off below delivers the same UX with the file never leaving the browser:
> `postMessage` transfers the `File` between the two tabs via structured clone.

#### Data (byte-identical everywhere)

The canonical source of truth is **`family-map.json` in the hub repo**
(`MichalAFerber/file-viewer.us`). Each viewer embeds the same data as JS
constants; the harness keeps them honest (see *Governance* below).

```js
/* FV-MAP-START — generated from family-map.json (canonical); deep-equality enforced by the harness */
var FAMILY = {
  cert:     { domain:"cert-viewer.us",     label:"Cert Viewer",     kind:"a certificate" },
  data:     { domain:"data-viewer.us",     label:"Data Viewer",     kind:"a data file" },
  docx:     { domain:"docx-viewer.us",     label:"DOCX Viewer",     kind:"a Word document" },
  eml:      { domain:"eml-viewer.us",      label:"EML Viewer",      kind:"an email file" },
  epub:     { domain:"epub-viewer.us",     label:"EPUB Viewer",     kind:"an e-book" },
  html:     { domain:"html-viewer.us",     label:"HTML Viewer",     kind:"a web or source-code file" },
  image:    { domain:"image-viewer.us",    label:"Image Viewer",    kind:"an image" },
  log:      { domain:"log-viewer.us",      label:"Log Viewer",      kind:"a log file" },
  markdown: { domain:"markdown-viewer.us", label:"Markdown Viewer", kind:"a Markdown or text file" },
  pdf:      { domain:"pdf-viewer.us",      label:"PDF Viewer",      kind:"a PDF" },
  pptx:     { domain:"pptx-viewer.us",     label:"PPTX Viewer",     kind:"a presentation" },
  pub:      { domain:"pub-viewer.us",      label:"PUB Viewer",      kind:"a Publisher file" },
  sheets:   { domain:"sheets-viewer.us",   label:"Sheets Viewer",   kind:"a spreadsheet" }
};
var FAMILY_HUB = "file-viewer.us";
var FAMILY_NAMES = { "robots.txt": "html" };
var FAMILY_MAP = {
  // cert
  pem:"cert", crt:"cert", cer:"cert", der:"cert", csr:"cert", cert:"cert", p7b:"cert", p12:"cert", pfx:"cert",
  // data
  json:"data", jsonc:"data", json5:"data", jsonld:"data", ndjson:"data", yaml:"data", yml:"data", toml:"data",
  csv:"data", tsv:"data", xml:"data", rss:"data", atom:"data", graphql:"data", gql:"data",
  // docx (incl. accept-with-notice legacy types — the notice IS the destination's answer)
  docx:"docx", docm:"docx", dotx:"docx", dotm:"docx", doc:"docx", dot:"docx", rtf:"docx", odt:"docx",
  // eml
  eml:"eml", mbox:"eml", emlx:"eml", msg:"eml",
  // epub
  epub:"epub",
  // html (web + source code)
  html:"html", htm:"html", xhtml:"html", xht:"html", shtml:"html", shtm:"html", stm:"html", hta:"html",
  mhtml:"html", mht:"html", css:"html", scss:"html", sass:"html", less:"html", styl:"html", pcss:"html",
  postcss:"html", js:"html", mjs:"html", cjs:"html", jsx:"html", ts:"html", mts:"html", cts:"html",
  tsx:"html", coffee:"html", htaccess:"html", htpasswd:"html", env:"html", ini:"html", conf:"html",
  webmanifest:"html", map:"html", php:"html", phtml:"html", asp:"html", aspx:"html", ascx:"html",
  cshtml:"html", vbhtml:"html", jsp:"html", jspx:"html", cfm:"html", erb:"html", rhtml:"html", ejs:"html",
  hbs:"html", handlebars:"html", mustache:"html", njk:"html", liquid:"html", jinja:"html", j2:"html",
  twig:"html", pug:"html", jade:"html", haml:"html", slim:"html", vue:"html", svelte:"html", astro:"html",
  // image
  png:"image", jpg:"image", jpeg:"image", jpe:"image", jfif:"image", gif:"image", webp:"image",
  avif:"image", svg:"image", svgz:"image", bmp:"image", dib:"image", ico:"image", cur:"image",
  tif:"image", tiff:"image", tga:"image", targa:"image", icb:"image", vda:"image", vst:"image",
  qoi:"image", pcx:"image", ppm:"image", pgm:"image", pbm:"image", pnm:"image", pam:"image",
  ff:"image", dds:"image", heic:"image", heif:"image", jxl:"image", psd:"image",
  // log (NOTE: no txt here — see the ⚠️ below)
  log:"log", out:"log", err:"log", trace:"log", syslog:"log",
  // markdown
  md:"markdown", markdown:"markdown", mdx:"markdown", txt:"markdown", rst:"markdown", adoc:"markdown",
  // pdf
  pdf:"pdf",
  // pptx
  pptx:"pptx", pptm:"pptx", ppsx:"pptx", ppsm:"pptx", potx:"pptx", potm:"pptx", ppt:"pptx",
  // pub
  pub:"pub",
  // sheets
  xlsx:"sheets", xlsm:"sheets", xlsb:"sheets", xls:"sheets", xlt:"sheets", xltx:"sheets", xltm:"sheets",
  xlam:"sheets", ods:"sheets", fods:"sheets", dif:"sheets", prn:"sheets", dbf:"sheets", numbers:"sheets",
  xlml:"sheets", wk1:"sheets", wk3:"sheets", wks:"sheets", "123":"sheets", et:"sheets", uos:"sheets"
};
/* FV-MAP-END */
var FAMILY_ORIGINS = Object.keys(FAMILY).map(function(k){ return "https://" + FAMILY[k].domain; })
  .concat("https://" + FAMILY_HUB);   // the hub can send hand-offs; nothing routes to it
```

⚠️ **`.txt` is accepted by both markdown and log as built.** For routing,
**markdown owns `.txt`** (per §1). The log viewer keeps `txt` in its own local
`ACCEPT_EXT` — map ownership decides only where *other* sites send a rejected
file, never what a viewer accepts for itself.

#### Hook (one line per viewer)

Wherever the "isn't a supported file type" toast fires, try the router first.
`familyRoute` returns `true` when it showed the offer card (suppress the toast):

```js
function familyRoute(file){
  var n = String(file && file.name || "").toLowerCase();
  var key = FAMILY_NAMES[n];
  if (!key){
    var i = n.lastIndexOf(".");
    var ext = i >= 0 ? n.slice(i + 1) : "";
    key = FAMILY_MAP[ext];
  }
  if (!key || FAMILY[key].domain === DOMAIN) return false;  // unknown type, or our own → caller keeps its toast
  showRouteCard(file, key);
  return true;
}
// call site (every viewer):
//   if (!isAccepted(file.name)) { if (!familyRoute(file)) toast("“" + file.name + "” isn’t a supported file type"); return; }
```

Self-identity comes from the viewer's existing `DOMAIN` constant (§8), so the
block above stays **byte-identical** on every site. The **image viewer** has no
accept gate (it sniffs magic bytes); it calls `familyRoute(file)` from its
"Can't display" path instead, before falling back to its message card.

#### Offer card

The ~2 s toast is too fast for a decision — this is a small dialog styled
with the shell tokens. Markup (once, near the toast element):

```html
<div class="route-backdrop" id="routeBackdrop" hidden></div>
<div class="route-card" id="routeCard" role="alertdialog" aria-modal="true" aria-labelledby="routeMsg" aria-describedby="routeSub" hidden>
  <p id="routeMsg"></p>
  <p class="route-sub" id="routeSub" aria-live="polite">Your file stays on this device — nothing is uploaded.</p>
  <div class="route-actions">
    <button type="button" class="route-go" id="routeGo"></button>
    <button type="button" class="route-dismiss" id="routeDismiss">Not now</button>
  </div>
</div>
```

```css
.route-backdrop{ position:fixed; inset:0; background:var(--shadow); z-index:44 }
.route-card{ position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:45;
  background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:16px;
  box-shadow:0 12px 40px var(--shadow); padding:1.1rem 1.25rem; width:min(92vw,26rem) }
.route-sub{ color:var(--muted); font-size:.85rem; margin-top:.35rem }
.route-actions{ display:flex; gap:.5rem; justify-content:flex-end; margin-top:.9rem }
.route-actions button{ border-radius:9px; padding:.55rem .9rem; font:inherit; cursor:pointer }
.route-go{ background:var(--accent); color:var(--accent-contrast); border:1px solid var(--accent) }
.route-dismiss{ background:transparent; color:var(--text); border:1px solid var(--border) }
```

Behavior (verbatim — note every string sink is `textContent`; see the ⚠️ XSS
rule under the hand-off protocol):

```js
var routeFile = null, routeKey = "", routePrevFocus = null, handoff = null;
function cancelHandoff(){                    // tear down a pending hand-off (sender below)
  if (!handoff) return;
  window.removeEventListener("message", handoff.onMsg);
  clearTimeout(handoff.timer);
  handoff = null;
}
function showRouteCard(file, key){
  cancelHandoff();                           // a new offer aborts any pending hand-off
  if (id("routeCard").hidden) routePrevFocus = document.activeElement;  // don't capture our own button
  routeFile = file; routeKey = key;
  var t = FAMILY[key];
  // ⁨…⁩ (FSI…PDI) bidi-isolate the untrusted name so U+202E-style
  // overrides can't visually reorder the sentence.
  id("routeMsg").textContent = "“⁨" + file.name + "⁩” looks like " + t.kind + " — it belongs to " + t.label + ".";
  id("routeGo").textContent = "Open " + t.domain + " ↗";
  id("routeSub").textContent = "Your file stays on this device — nothing is uploaded.";
  id("routeGo").disabled = false;
  id("routeBackdrop").hidden = false; id("routeCard").hidden = false;
  id("routeGo").focus();
}
function hideRouteCard(){
  cancelHandoff();                           // dismissal aborts a pending hand-off
  id("routeBackdrop").hidden = true; id("routeCard").hidden = true;
  routeFile = null; routeKey = "";
  if (routePrevFocus && routePrevFocus.focus) routePrevFocus.focus();
}
```

Backdrop click, **Escape** (extend the shell's existing Escape handler), and
*Not now* all call `hideRouteCard()`; focus returns to the previously focused
element. **Tab**/**Shift+Tab** cycle between the two buttons while the card is
open — the dialog claims `aria-modal`, so focus must not walk beneath the
backdrop. The card carries `aria-describedby="routeSub"` and the sub-line
`aria-live="polite"`, so the pop-up-blocked and fallback state changes are
announced. Dropping a different file while the card is open just calls
`showRouteCard` again — the newest file wins. The card must stack above the
whole shell: 44/45 clear the topbar (36) and hover zone (35); if a viewer's
nav panel/backdrop sit higher, raise these two together.

#### Hand-off protocol (sender + receiver)

**Sender** — the `routeGo` click handler (a real user gesture, so no popup
blocker). Keep the window handle: **no `noopener` on this one `window.open`** —
the handle is the message channel (acceptable within the trusted family; the
receiver never touches `window.opener` except for the ready ping).

```js
id("routeGo").addEventListener("click", function(){
  if (!routeFile || id("routeGo").disabled) return;               // no double-fire
  cancelHandoff();
  var t = FAMILY[routeKey], origin = "https://" + t.domain, file = routeFile;
  var w = window.open(origin + "/#fvh=" + encodeURIComponent(file.name));
  if (!w){ id("routeSub").textContent = "Couldn’t open the tab — allow pop-ups for this site and try again."; return; }
  id("routeGo").disabled = true;
  var h = {};
  h.onMsg = function(e){
    if (e.source !== w || e.origin !== origin || !e.data) return;
    if (e.data.type === "fv-ready") w.postMessage({ type:"fv-file", file:file }, origin);
    else if (e.data.type === "fv-ack"){ hideRouteCard(); toast("Sent to " + t.label); }  // hideRouteCard tears the handshake down
  };
  h.timer = setTimeout(function(){
    if (handoff !== h) return;
    cancelHandoff();
    id("routeSub").textContent = "Tab opened — drop the file there.";   // Level-1 fallback
  }, 10000);
  handoff = h;
  window.addEventListener("message", h.onMsg);
});
```

⚠️ **Tracked hand-off (`handoff`/`cancelHandoff`) is contractual.** Without it,
a stale listener from an earlier *Open* click survives dismissal: a late
`fv-ack` from tab A closes a newer card shown for file B, and the old 10 s
timer rewrites the visible card's sub-line. Dismissing the card or opening a
new offer must abort the pending hand-off.

**Receiver** — every **viewer** ships this once, in the main IIFE (not the
hub — nothing routes to it). `handleFile` is the viewer's existing single-file
entry point:

```js
window.addEventListener("message", function(e){
  if (FAMILY_ORIGINS.indexOf(e.origin) === -1) return;      // family origins only
  var d = e.data;
  if (d && d.type === "fv-file" && d.file instanceof File){ // clone re-creates a real File in this realm
    handleFile(d.file);
    e.source.postMessage({ type:"fv-ack" }, e.origin);      // ack = received and handed to the loader
  }
});
var fvh = /[#&]fvh=([^&]*)/.exec(location.hash);
if (fvh){
  var fvhName = decodeURIComponent(fvh[1]);                 // ⚠️ stranger-controlled — textContent only
  history.replaceState(null, "", location.pathname + location.search);  // always clear, opener or not
  if (window.opener){
    try { window.opener.postMessage({ type:"fv-ready" }, "*"); } catch(_){}
    window.opener = null;    // sever the reverse-navigation channel once the ping is out
    // SHOULD: empty-state sub-line = "Receiving “" + fvhName + "”…" via textContent; revert after ~10 s
  }
}
```

Rules:

- The `File` crosses via **structured clone** — in-browser, never on the wire.
  **CSP: no changes** — `postMessage` is not governed by `connect-src`.
- The ready ping carries **no data** and may go to `"*"`; the sender validates
  `e.source === w && e.origin === origin` before answering, and posts the file
  with an **exact** `targetOrigin`. The receiver accepts files only from
  `FAMILY_ORIGINS`.
- ⚠️ **XSS:** `file.name` and the decoded `#fvh` value are untrusted input —
  any page anywhere can open a viewer with an arbitrary hash, no gesture
  required. Every sink they reach (`routeMsg`, `routeGo`, the toast, the
  "Receiving…" sub-line, `docTitle`) MUST be assigned via `textContent` (or a
  text node), never `innerHTML` / `insertAdjacentHTML`. With
  `script-src 'unsafe-inline'`, one `innerHTML` here is a zero-click DOM XSS.
- While the hand-off is pending, the receiver SHOULD show
  `Receiving “<fvhName>”…` in the empty-state sub-line, reverting to normal
  copy if no file arrives within ~10 s. A direct visit with `#fvh` but no
  `window.opener` shows the normal empty state (the hash is cleared either
  way).
- Unmapped extensions keep today's rejection toast. Multi-file drops route on
  the first rejected file only (loaders are single-file).

#### Governance

- `family-map.json` (hub repo, `MichalAFerber/file-viewer.us`) is **canonical**.
  A type changes owners via a hub PR first, then propagates to the viewers.
- The data block sits between the `/* FV-MAP-START */` and `/* FV-MAP-END */`
  comments so the harness (§12) can check it **without running the page** (the
  constants are IIFE-scoped and invisible at runtime): slice `index.html`
  between the markers, evaluate the object literals in the test process, and
  deep-compare `FAMILY`, `FAMILY_HUB`, `FAMILY_NAMES`, and `FAMILY_MAP`
  against the canonical file — read at **test time** from the repo checkout or
  the hub's raw URL, never fetched at runtime (offline-first). Cross-site
  parity is **deep-equality** against the canonical file, not byte equality of
  the block's layout; byte-identity is required between pages of the *same*
  site that carry the block. Generate the block from `family-map.json` rather
  than hand-copying a listing.
- ⚠️ **The allowlist is a domain-trust commitment.** A lapsed or transferred
  family domain becomes a trusted hand-off target on every site — a
  file-exfiltration sink that would falsify "files never leave your device."
  Keep all 14 domains on auto-renew with registrar lock, monitor expiry, and
  treat the loss of any one as a family-wide incident: remove it from
  `FAMILY` / `FAMILY_ORIGINS` and redeploy every site immediately.
- The **hub** ships the **sender side only** — map, offer card, drop/paste
  plumbing, and toast: a compact drop zone under the hero plus the full-page
  Universal Viewer at `/universal` (see §16). With `DOMAIN = "file-viewer.us"`
  every mapped type routes out, making the hub the family's universal front
  door. Nothing routes *to* the hub, so it ships **no receiver**; its origin is
  in `FAMILY_ORIGINS` (via `FAMILY_HUB`) so the viewers' receivers accept its
  hand-offs.

---

## 7. Head, favicon & brand icon

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ffffff" id="themeColor">
<meta name="description" content="…viewer-specific…">
<title><Type> Viewer</title>
<script defer data-domain="<domain>" src="https://plausible.thompsonblack.us/js/script.js"></script>
<link rel="icon" href="data:image/svg+xml,<URL-ENCODED file_type_*.svg>">
```

Reuse that favicon as the header brand icon (single source of truth):

```html
<img id="brandIcon" class="brand-icon" alt="" aria-hidden="true">
```
```js
var favLink = document.querySelector('link[rel="icon"]');
if (brandIcon && favLink) brandIcon.src = favLink.href;
```

To generate the data URI: `"data:image/svg+xml," + encodeURIComponent(svgText)`.

### 7.1 SEO / Open-Graph / social kit (every viewer + the hub)

Every site ships the following so shared links get a rich preview and it indexes
cleanly. Paste in `<head>` after `description`, filling in title/description/domain:

```html
<link rel="canonical" href="https://<domain>/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="File Viewer">
<meta property="og:title" content="<Title>">
<meta property="og:description" content="<desc>">
<meta property="og:url" content="https://<domain>/">
<meta property="og:image" content="https://<domain>/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<Title>">
<meta name="twitter:description" content="<desc>">
<meta name="twitter:image" content="https://<domain>/og.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"<Title>","url":"https://<domain>/","applicationCategory":"UtilityApplication","operatingSystem":"Any","browserRequirements":"Requires JavaScript","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"description":"<desc>"}</script>
```
(The **hub** uses `"@type":"WebSite"` and drops `offers`.) The inline `ld+json`
is allowed by `script-src 'unsafe-inline'`; `og:image` is fetched by scrapers,
not the page, so it needs no CSP allowance.

**Sidecar assets (repo root, served by Pages):**
- **`og.png`** — a **1200×630** share card: the file-type favicon on a rounded
  white tile over a subtle `#4f46e5`→white gradient, the viewer name (bold), a
  one-line tagline, and `<domain> · part of the File Viewer family`. Generate by
  rendering an HTML card and screenshotting it with the headless browser.
- **`apple-touch-icon.png`** — 180×180, favicon centered on white.
- **`robots.txt`** — `User-agent: *` / `Allow: /` / `Sitemap: https://<domain>/sitemap.xml`.
- **`sitemap.xml`** — one `<url><loc>https://<domain>/</loc>…</url>`.

⚠️ If a viewer's `img-src` omits `'self'`, the same-origin `apple-touch-icon.png`
is CSP-blocked — add `'self'` to `img-src`.

---

## 8. Per-viewer adapter contract

Everything above is shared. A viewer differs only in the **adapter** below.
Implement it and wire it into the shared shell.

```
CONFIG (constants)
  BASE_TITLE     e.g. "Data Viewer"
  DOMAIN         e.g. "data-viewer.us"          // Plausible data-domain
  REPO_URL       github.com/MichalAFerber/data-web-viewer
  FAVICON        data:image/svg+xml,…file_type_db…
  ACCEPT_EXT     { json:1, yaml:1, … }          // this viewer's types ONLY
  ACCEPT_NAME    { … }                          // exact filenames if any

isAccepted(name) -> bool
  // shared logic: exact-name match OR extension in ACCEPT_EXT.
  // Reject everything else with a toast ("…isn't a supported file type").

classify(name, text) -> { rendered: bool, lang: string|"", canFormat: bool }
  // rendered:true  → file has a Rendered plane (show the </> toggle if it also
  //                  has a Source plane).
  // rendered:false → open directly in the Source plane (text files).
  // lang           → highlight.js language hint for the Source plane.
  // canFormat      → js-beautify supports this type (show { }).

renderInto(text_or_bytes, name, mountEl) -> void   // the Rendered plane
  // Produce the viewer-specific rendered output inside mountEl.
  // Must NOT execute untrusted scripts (see §9). Keep the canvas neutral.

readMode -> "text" | "arraybuffer"
  // text viewers (html/markdown/data) read as text; pdf/epub read as bytes.
```

**Reference adapters:**
- **html:** `classify` → HTML-family renders in a `sandbox=""` iframe via
  `srcdoc`; everything else is Source-only. `renderInto` sets
  `iframe.srcdoc = text`. `canFormat` for html/css/js/template types.
- **markdown:** render = `DOMPurify.sanitize(marked.parse(text))` injected into a
  `.prose` container; Source plane = raw markdown. (marked + DOMPurify inline.)
- **data:** see §15.
- **epub / pdf:** `readMode:"arraybuffer"`, no Source plane, no toggle/Format.

---

## 9. Security model

- **Never execute untrusted content’s scripts.** For html-viewer the Rendered
  plane is a `sandbox` iframe **without `allow-scripts`** — the page shows its
  own styles but no JS ever runs. (html-viewer adds `allow-same-origin`
  **only** so the parent can read the frame’s scroll for the auto-hiding header;
  with no `allow-scripts` this is safe.) A viewer that sniffs/loads arbitrary
  HTML MUST use the same locked sandbox.
- **Sanitize** any HTML you inject into the top document (markdown → DOMPurify).
- **Files never leave the device.** No uploads, no `fetch` of user content.
  (The §6.10 hand-off moves a `File` between two family tabs via `postMessage`
  structured clone — in-browser, never over the network.)
- **`_headers` ships a strict CSP** (§10). Tighten it per viewer:
  - html: needs `style-src/img/font/media … https:` so rendered pages can pull
    external CSS/fonts/images; `script-src` stays `'unsafe-inline'` + Plausible
    only (the sandbox is the real script barrier).
  - **data / markdown:** you control the rendered DOM, so you can be **stricter**
    — drop the `https:` loosenings you don’t need. Data rarely needs remote
    assets; keep `img-src 'self' data:` etc.
  - pdf/epub: allow `blob:`/`worker-src` if the renderer (pdf.js) needs a worker.

---

## 10. `_headers` (Cloudflare Pages) — CSP template

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' https://plausible.thompsonblack.us; style-src 'unsafe-inline' https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src https://plausible.thompsonblack.us; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```
Adjust the middle directives per §9. Keep `default-src 'none'`, the framing
protections, and `connect-src`/`script-src` limited to Plausible. Confirm every
inlined library is **`eval`-free** so you never need `'unsafe-eval'`.

---

## 11. Accessibility & responsiveness (required)

- Skip link; real `aria-label`s on every control; `aria-pressed` on toggles;
  `aria-live` toast; `role="button"`+`tabindex="0"` on the empty state with
  Enter/Space handling.
- `:focus-visible` rings on all interactives.
- `@media (prefers-reduced-motion:reduce){ *{transition:none!important} }`.
- `<meta name="color-scheme" content="light dark">` and set
  `documentElement.style.colorScheme` from `applyColor`.
- Mobile-first; `100dvh`; `env(safe-area-inset-*)` on header/footer; tap targets
  ≥40px; `-webkit-tap-highlight-color:transparent`.

---

## 12. Verification harness (headless Chromium)

Drive the real file under the **real deployed CSP** and assert behavior. Pattern
(Node + `playwright-core`, Chromium at `/opt/pw-browsers/.../chrome`):

1. Serve the repo over `http://127.0.0.1`, sending the **exact CSP line parsed
   from `_headers`** as a response header.
2. `page.setInputFiles('#fileInput', fixture)` to load files (covers drop too).
3. Assert against the contractual IDs/classes. Sandboxed frames are readable via
   Playwright even cross-origin (`page.frames()[i].evaluate(...)`).
4. Treat the sandbox’s own `Refused/​sandboxed` console message and the
   analytics `ERR_CONNECTION_RESET` (offline test env) as **expected**; fail on
   any other console/page error.

Keep small fixtures per behavior (a rendered file, a source file, a rejected
type, a minified file, a tall file for scroll). The reference repo’s scratch
harness (`e2e*.js`) is a working template.

---

## 13. Parity checklist (definition of "the level")

A viewer is at parity when **all** of these pass:

**Shell & identity**
- [ ] Single `index.html`, no build, works from `file://`, fully offline (except Plausible tag).
- [ ] Correct `<title>`, `data-domain`, favicon (`file_type_*`), GitHub link, footer credit.
- [ ] Brand icon (= favicon) left of the title; base title on empty screen; filename while viewing.
- [ ] Action buttons visible on the empty screen and while viewing.
- [ ] **Empty card is compact/centered** (`max-width:30rem`, not full-screen); its sub-line **lists the accepted types**.

**Theming**
- [ ] Color swatch sets any background; text/border/`--hl-*` adapt; light **and** dark legible; `theme-color` + `colorScheme` update.
- [ ] Choice persists (cookie + `localStorage`), survives reload and `file://`.

**Interaction**
- [ ] Drag-drop anywhere (full-screen overlay), paste, and tap-to-open all work.
- [ ] **Drop-to-replace:** dropping a new file while one is open replaces it — including *over an iframe rendered plane* (browser must not open the file in a new tab).
- [ ] **Family nav:** the ☰ flyout lists Home/HTML/Markdown/ePUB/Data/PDF — icons = each destination's **site favicon** (Home = 🗂️) — current site active; opens on click, closes on backdrop/Escape. (Hub excepted.)
- [ ] **File-type validation:** only this viewer’s types are accepted; others get the rejection toast and are not shown.
- [ ] **Header:** shows on open, **auto-hides after 3 s** collapsing to the **thick tappable handle** over the rendered content; **hover / touch / tap / scroll-up** reveals it; the source plane keeps the header.
- [ ] Footer × (far-right, vertically centered — `.footer .footer-close` beats `[data-tip]`) hides the footer; **no horizontal scrollbar** (`html,body{overflow-x:clip}`); header padding parity (`1rem` ≥640 px). Fast tooltips (~0.1 s); touch suppresses them.
- [ ] Copy and Clear work; toasts fire.
- [ ] **Family router:** dropping a sibling viewer's type shows the offer card (not the plain toast); *Open* hands the file to the new tab (`fv-ready` → `fv-file` → `fv-ack`); unmapped types still get the rejection toast.
- [ ] **Router receiver:** a `fv-file` message from a family origin loads the file; non-family origins are ignored; `#fvh` is cleared on load.
- [ ] **Map parity:** the `/* FV-MAP-START */…/* FV-MAP-END */` block (`FAMILY`, `FAMILY_HUB`, `FAMILY_NAMES`, `FAMILY_MAP`) deep-equals the hub repo's canonical `family-map.json`.

**Planes**
- [ ] Rendered plane is faithful and **runs no untrusted scripts**.
- [ ] (text viewers) Source plane: highlighted, line-numbered, gutter aligned; `</>` toggle present when two planes exist; header clearance correct.
- [ ] (formattable) `{ }` Format toggles beautify ↔ raw; Copy respects it; resets per file; hidden for non-formattable/binary.

**Security & deploy**
- [ ] `_headers` present; CSP `default-src 'none'`; every inline lib `eval`-free.
- [ ] Deploys on Cloudflare Pages (`main`, no build, output `/`); custom domain set; domain added in Plausible.

**A11y**
- [ ] Skip link, focus rings, aria-labels/pressed/live, reduced-motion, keyboard-operable empty state.

**SEO & social**
- [ ] `<head>` has canonical + Open Graph + Twitter card + JSON-LD; `og.png` (1200×630), `apple-touch-icon.png`, `robots.txt`, `sitemap.xml` present; `img-src` allows `'self'` + `data:`.

**Verified**
- [ ] Headless-Chromium harness green under the real CSP.

---

## 14. Repo layout & workflow

```
index.html            # the app (self-contained)
_headers              # Cloudflare Pages security headers (CSP …)
og.png                # 1200×630 Open Graph / Twitter share card (§7.1)
apple-touch-icon.png  # 180×180 touch icon (§7.1)
robots.txt            # allow all + sitemap pointer (§7.1)
sitemap.xml           # single-URL sitemap (§7.1)
README.md             # features, supported types, deploy, credits (see reference)
LICENSE               # MIT + bundled-component notices (highlight.js BSD-3, js-beautify MIT, vscode-icons MIT)
.gitignore            # OS/editor cruft
```
- Develop on a feature branch; open a PR into `main`; Cloudflare auto-deploys
  `main`. Framework preset **None**, build command blank, output dir `/`.
- **Credits are mandatory:** README `## Credits` table + `LICENSE` notices for
  every inlined library and the vscode-icons favicon, with versions + license.
- README should mirror the reference’s sections: intro, Live link, Features,
  Supported file types, Deploy, How it works, Privacy, Credits, License. Include
  the "part of a family of viewers; other types have their own viewer" note.

---

## 15. Green-field brief: **data-viewer**

Build `data-web-viewer` from scratch to this spec. Identity: title
`Data Viewer`, domain `data-viewer.us`, favicon `file_type_db.svg`, repo
`MichalAFerber/data-web-viewer`.

**Accepted types:** `.json .jsonc .json5 .jsonld .ndjson .yaml .yml .toml .csv
.tsv .xml .rss .atom .graphql .gql` (reject everything else).

**Two planes (both present for all types):**
- **Rendered plane (default)** — a *pretty, structured* view:
  - **JSON / JSONC / JSON5 / JSONLD / TOML / YAML** → parse to a JS object and
    render a **collapsible key/value tree** (expand/collapse nodes, type-colored
    values, copy-path). Parse YAML/TOML to JSON first (bundle a tiny inline
    parser, e.g. a minified `js-yaml`/`@iarna/toml`; verify `eval`-free).
  - **NDJSON** → one collapsible record per line.
  - **CSV / TSV** → a **table** (sticky header, zebra rows, horizontal scroll).
    Parse with a tiny inline CSV parser (handle quoted fields/newlines).
  - **XML / RSS / ATOM / GraphQL** → pretty-printed, highlighted structure
    (a collapsible XML tree for XML/RSS/ATOM).
- **Source plane** — the raw text, highlight.js (`json`, `yaml`, `xml`,
  `graphql`, plaintext for csv/tsv/toml as available) with the gutter.
- `</>` toggles Rendered ↔ Source; `{ }` **Format** pretty-prints the source
  (JSON/YAML/XML) via js-beautify (or `JSON.stringify(parsed, null, 2)` for
  JSON) — raw by default.

**Nice-to-haves (parity-neutral):** search/filter within the tree; collapse-all
/ expand-all; show item counts on arrays/objects; validity toast on parse error
(with line/column when available). Keep everything inline & offline.

**Security:** data-viewer never renders arbitrary HTML, so its CSP can be
**tighter** than html-viewer’s — drop the `https:` loosenings; `img-src 'self'
data:` is enough. Build the tree/table as DOM you create (escape all text); do
not `innerHTML` untrusted strings.

> **Status:** data-viewer is **built** (`MichalAFerber/data-web-viewer`). Use it
> as the second reference implementation alongside html-viewer.

---

## 16. The hub: **file-viewer.us**

`file-web-viewer` is the family home — a single static `index.html`, **no file
machinery, no hamburger** (it is Home).

- **Chrome:** the shared tokens + adaptive **color picker** + GitHub link + a
  `File Viewer` brand (custom grid favicon). No drop zone, toast, or planes.
- **Content:** a hero (headline + one-line pitch + a “single-file · offline ·
  nothing uploaded” badge) and a **responsive card grid** — one `<a class="card">`
  per viewer, each with the viewer’s **`file_type_*` favicon** (inlined as a
  data URI), name, one-sentence description, an accepted-types line, and an
  “Open `<domain>` →” affordance. Cards link to the viewer domains.
- **CSP:** strict — `default-src 'none'`, `img-src 'self' data:` (all icons are
  inline data URIs; no external assets).
- This repo is the **canonical home for the shared design/template files**
  (this `DESIGN-SPEC.md`). Point new-viewer agents here.

Card copy + accepted-type summaries live in the hub’s `index.html`; keep them in
sync with each viewer’s real accepted list (§1).

> **2026-08 update:** the hub now ships the **family router’s sender side**
> (§6.10): a compact **universal drop zone** under the hero, a full-page
> **Universal Viewer** at `/universal` (drag & drop anywhere, paste, or tap to
> open), and a **`/tools`** directory listing every viewer with the exact
> extensions it owns (kept in parity with `family-map.json` by the harness).
> Dropping a file routes it by name — the offer card opens the owning viewer
> and hands the file across per §6.10. “No file machinery” above is therefore
> historical: the hub still has **no planes and renders nothing**, but it does
> carry the drop zone, toast, and router chrome. The header nav and the
> footer’s Tools column link both pages. Unmapped drops get the hub’s own
> rejection toast — `“⟨name⟩” isn’t supported by the File Viewer family (yet)`
> — since the hub speaks for the whole family, not one viewer.

---

## 17. docx & sheets viewers (audit + build notes, 2026-07 — ✅ SHIPPED)

Both shipped as **`docx-viewer.us`** (`DOCX Viewer`) and **`sheets-viewer.us`**
(`Sheets Viewer`). Both stay **within the family constraints** (single file,
offline, strict CSP with **no `eval` / `new Function`**). The libraries were
downloaded and audited against the CSP before inlining:

| Format | Library | License | Size (min) | CSP-clean? |
| --- | --- | --- | --- | --- |
| **docx** | **docx-preview** + JSZip | Apache-2.0 / MIT | ~70 KB + ~95 KB | ✅ no `eval`/`Function`/wasm |
| docx | mammoth.js | BSD-2 | ~627 KB | ❌ bundles bluebird → runtime `new Function` (needs `'unsafe-eval'`) — **avoid** |
| **xlsx / xls** | **SheetJS** community (`xlsx`) | Apache-2.0 | ~861 KB | ✅ no `eval`/`Function`/wasm |

**docx viewer** — use **docx-preview + JSZip** (JSZip is already the epub unzip
lib). Renders `.docx` close to Word layout (styles, headings, lists, tables,
inline images, page framing) into a container. Reuse the shell; single rendered
plane (optionally a source plane showing `word/document.xml`).

**xlsx viewer** — use **SheetJS**. Parses `.xlsx` **and** legacy binary `.xls`;
`XLSX.read(data,{type:'array'})` → per-sheet HTML tables (`sheet_to_html`) with
**sheet tabs**. Essentially a sibling of the Data viewer (same table styling,
drop-to-replace). A "mini" build (~300 KB, xlsx/xls/csv only) is a leaner option.

**As built:** docx renders images inline via `useBase64URL` (data: URLs — CSP
needs **no `blob:`**); legacy `.doc/.dot/.rtf/.odt` are accepted and show an
**accept-with-notice** card ("open in Word/LibreOffice → Save As .docx"). Sheets
renders every worksheet as a table with **sheet tabs** and a **CSV source** view;
`.csv/.tsv` intentionally stay with the **data** viewer. Both verified under the
production CSP with headless Chromium (docx 17/17, sheets 13/13).

**Honest limits / caveats:**
- **Legacy `.doc`** (pre-2007 OLE binary): no good pure-browser renderer, so the
  docx viewer is really a **`.docx`** viewer — `.doc/.rtf/.odt` get the
  accept-with-notice card. Legacy `.xls`, by contrast, **is** handled by SheetJS.
- **xlsx fidelity:** the free SheetJS build shows **values + structure**, not
  rich cell styling/colors/merged formatting (that's SheetJS Pro); **formulas
  show their cached computed values**; **charts are not rendered**.
- **docx fidelity:** faithful for typical documents; not a pixel-perfect Word
  engine (complex headers/footers, footnotes, field codes may simplify).
- **Size:** xlsx (~861 KB) is heavy but under pdf.js's ~1.5 MB precedent; docx
  (~165 KB) is light.
- Shipped identities: **`docx-viewer.us`** and **`sheets-viewer.us`**. Each added
  **+1 item in the family nav** (§6.9, now 8 items A→Z) on every site + a new hub
  card (§16). Pinned versions audited for `eval`-freeness before shipping:
  docx-preview `0.3.3`, JSZip `3.10.1`, SheetJS `0.18.5`.

---

## 17.1 Roadmap viewers — ✅ ALL SHIPPED (2026-07)

All five cleared the family bar (single self-contained `index.html`, offline /
`file://`-safe, strict CSP with **no `eval` / `new Function`**, own SEO kit, +1
nav item A→Z, +1 hub card) and are live. **As built** — every one uses an
**original, dependency-free parser** (no third-party lib needed except JSZip for
pptx), verified headless under the production CSP:

- **EML** (`eml-viewer.us`) — hand-rolled MIME parser (multipart, base64/QP,
  charset, RFC 2047) + SPF/DKIM/DMARC header analysis; HTML body in a sandboxed
  iframe with a "load remote images" opt-in; attachments as `data:` downloads.
  `.msg` → accept-with-notice. **15/15 + 13/13.**
- **PPTX** (`pptx-viewer.us`) — original OOXML reader lays out text + images by
  their EMU coordinates (cqw font scaling); JSZip inlined. **14/14.**
- **Log** (`log-viewer.us`) — no libs; windowed virtual scroll (~40 DOM rows for
  6k lines), level filters, search-highlight. **13/13.**
- **Cert** (`cert-viewer.us`) — no libs; original ASN.1/X.509 + PKCS#10 decoder,
  Web Crypto fingerprints (match openssl). **17/17 + 17/17.**
- **PUB** (`pub-viewer.us`) — no libs; best-effort OLE/CFB reader (Summary­Information
  metadata + text extraction) with an honest "Save As PDF" banner. **13/13 + 6/6.**

Original write-up (design intent) retained below for the record.

Each cleared the same bar:
single self-contained `index.html`, offline / `file://`-safe, strict CSP with
**no `eval` / `new Function`**, inlined library, own SEO kit, +1 nav item A→Z,
+1 hub card.

| Idea | Domain (suggested) | Scope | Library sketch | CSP watch-out |
| --- | --- | --- | --- | --- |
| **EML / MSG viewer** ⭐ | `eml-viewer.us` | Parse `.eml`/`.msg`; show headers, body (text/HTML sandboxed), attachments — **plus SPF / DKIM / DMARC** header analysis | pure-JS MIME parse (emailjs-mime-parser or hand-rolled); `.msg` = CFB via a small OLE reader | sanitize HTML body → sandboxed iframe; no network for auth-result *lookups* (parse the headers that are present) |
| **Cert / CSR viewer** | `cert-viewer.us` | Decode X.509 `.pem/.crt/.cer/.der/.csr/.p12` — subject, SAN, validity, key usage, chain, fingerprints | `@peculiar/x509` or `PKI.js` (WebCrypto/ASN.1) | verify no `eval`; WebCrypto is CSP-fine; `.p12` needs a password prompt |
| **PPTX viewer** | `pptx-viewer.us` | Render `.pptx` slides (text, shapes, images) | JSZip + a pptx→HTML/canvas renderer | heavier; fidelity trade-offs like docx; watch bundle size |
| **Log viewer** | `log-viewer.us` | `.log`/plaintext with search, level filter, **virtualized** scroll for huge files | none (hand-rolled virtual list) | stream/chunk large files; keep DOM node count bounded |
| **PUB viewer** | `pub-viewer.us` | Microsoft Publisher `.pub` (CFB/OLE) | best-effort OLE parse | niche format, low fidelity — likely accept-with-notice like legacy `.doc` |

⭐ **EML/MSG is the priority pick** — it doubles as a lead magnet for the owner's
DNS-consulting brand (`fixdns.net` / `brokedns.com`): the SPF/DKIM/DMARC readout
turns "why did this mail fail auth?" into a shareable, self-serve tool.

---

### Appendix — where to copy from

For any block marked "verbatim," lift it from the reference
[`html-web-viewer/index.html`](https://github.com/MichalAFerber/html-web-viewer/blob/main/index.html):
the `:root` tokens, the full CSS shell (`.topbar`, `.iconbtn`, `.tip`,
`.swatch`, `.codewrap/.gutter/.code`, `.drop-overlay`, `.toast`, `.footer`),
`applyColor` + persistence, the scroll-header controller, the drag/drop/paste
handlers, and the `_headers` CSP. Change only the adapter (§8) and identity (§1).
