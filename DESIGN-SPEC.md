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
   auto-hiding header** §6.6, the **SEO/OG kit** §7.1, analytics, security
   headers) that is **identical** across viewers. Copy it verbatim.
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

## 17.1 Roadmap candidates (considered — not yet built)

Kept here so the family can grow deliberately. Each must clear the same bar:
single self-contained `index.html`, offline / `file://`-safe, strict CSP with
**no `eval` / `new Function`**, inlined library, own SEO kit, +1 nav item A→Z,
+1 hub card. Re-audit each library's pinned build before shipping.

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
