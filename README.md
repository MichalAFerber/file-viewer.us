# File Viewer — the family hub

The home page for the **File Viewer family** of fast, single-file, offline
viewers. One static `index.html` with a **card for each viewer** — drop a file
into the one that fits and it renders locally in your browser, nothing uploaded.

🔗 **Live:** <https://file-viewer.us/>

![Single file](https://img.shields.io/badge/build-single%20HTML%20file-success) ![No build step](https://img.shields.io/badge/build%20step-none-success) ![License](https://img.shields.io/badge/license-MIT-blue)

## The family

Thirteen dedicated viewers, listed A→Z (the same order as the **☰ Viewers** menu
in every header):

| Viewer | Site | Handles |
| --- | --- | --- |
| **Cert** | [cert-viewer.us](https://cert-viewer.us/) | X.509 certificates, CSRs & keys — subject/issuer, validity, SANs, fingerprints (`.pem .der .crt .cer .csr`) |
| **Data** | [data-viewer.us](https://data-viewer.us/) | JSON, YAML, CSV, XML & TOML with a collapsible tree + table view |
| **DOCX** | [docx-viewer.us](https://docx-viewer.us/) | Word documents with formatting, styles, tables & images (`.docx`) |
| **EML** | [eml-viewer.us](https://eml-viewer.us/) | Email messages — headers, HTML/plain body, attachments, SPF/DKIM/DMARC (`.eml`) |
| **ePUB** | [epub-viewer.us](https://epub-viewer.us/) | EPUB e-books with chapters, images & styling |
| **HTML** | [html-viewer.us](https://html-viewer.us/) | Rendered HTML plus syntax-highlighted CSS / JS / TS source |
| **Image** | [image-viewer.us](https://image-viewer.us/) | Any image — PNG, JPEG, WebP, SVG plus TIFF, TGA, QOI, PCX, PPM, farbfeld, DDS; zoom, EXIF, export to PNG |
| **Log** | [log-viewer.us](https://log-viewer.us/) | Large logs with virtual scrolling, level coloring & search (`.log .txt`) |
| **Markdown** | [markdown-viewer.us](https://markdown-viewer.us/) | Markdown, TXT, RST & AsciiDoc rendered to formatted HTML |
| **PDF** | [pdf-viewer.us](https://pdf-viewer.us/) | PDF documents, page by page |
| **PPTX** | [pptx-viewer.us](https://pptx-viewer.us/) | PowerPoint slides with text, shapes & layout (`.pptx`) |
| **PUB** | [pub-viewer.us](https://pub-viewer.us/) | Microsoft Publisher metadata & extracted text — best-effort (`.pub`) |
| **Sheets** | [sheets-viewer.us](https://sheets-viewer.us/) | Excel / ODS spreadsheets with multiple sheets & formulas (`.xlsx .xls .ods .csv`) |

Every viewer shares the same shell: a **☰ family menu** to jump between them, an
**auto-hiding header**, a **pick-any-background-color** control, strict
**local-only** processing (files never leave your device), and self-hosted,
cookieless [Plausible](https://plausible.io/) analytics.

## Try it with a sample

The hub ships a [`samples/`](samples/) folder with a ready-to-test file for every
viewer — the landing page links each one under **"Try it with a sample."** Grab a
file, then drop it into the matching viewer:

```
samples/
├─ cert/      sample-cert.pem · sample-cert.der · sample.csr
├─ data/      sample.csv · sample.json · sample.toml · sample.xml · sample.yaml
├─ docx/      sample.docx
├─ eml/       sample.eml
├─ epub/      sample.epub
├─ html/      sample.html · styles.css · app.js · app.ts
├─ image/     sample.tif · sample.qoi · sample.dds
├─ log/       sample.log
├─ markdown/  sample.md
├─ pdf/       sample.pdf
├─ pptx/      sample.pptx
├─ pub/       sample.pub
└─ sheets/    sample.xlsx
```

The sample files share a small fictional theme (**"Northwind Coffee Co."**) so
they read as a coherent set.

## Design system

This repo is the **canonical home for the shared design system**: see
[`DESIGN-SPEC.md`](DESIGN-SPEC.md) — the single, agent-ready spec for building a
new viewer or bringing an existing one to parity (shared shell + per-viewer
adapter contract + parity checklist).

## What's here

- `index.html` — the hub landing page (self-contained, no build).
- `support.html` — support page + contact form (posts to the house mailer).
- `samples.html` · `credits.html` · `privacy.html` · `terms.html` · `404.html` — the rest of the site.
- `samples/` — one ready-to-test file per viewer.
- `DESIGN-SPEC.md` — the design & build spec for the whole family.
- `_headers` — Cloudflare Pages security headers (strict CSP).

Every page carries the same house header and footer. The chrome — the `.topbar`
block, the `.site-footer` block, and the shared script under them — is
**byte-identical across pages on purpose**: this family has no build step and no
component layer, so the copies are the mechanism. Change one, change all six,
and `npm test` will tell you if you missed one.

## Deploy

Static site on Cloudflare Pages: framework preset **None**, build command
blank, output directory `/`. Add the custom domain **file-viewer.us**. Every
viewer deploys the same way from its own repo.

## Standards

Built to the TGWAB Dev Standards **v2.34.0** (internal). Class A — open source,
MIT, public repo.

### Before the contact form goes live

`/support` renders and submits, but the mailer has to know this product first.
Until all three steps are done a submission gets `unknown_product` or
`origin_denied`, and the page says so rather than pretending it sent.

This product rides the **shared Products Turnstile widget** — `support.html`
carries that widget's site key, which is the public half and belongs in the page.

1. **No `notifyctl add`.** The product is already registered as `file_viewer_us`
   (domain `file-viewer.us`, `from_addr` `noreply@file-viewer.us`), and the
   mailer's route regex `[a-z0-9_]+` accepts underscores — only hyphens are
   rejected, so `file-viewer` is out but `file_viewer_us` is fine. The page posts
   to `/contact/file_viewer_us`; change one and change the other. Adding a second
   slug for this domain would make it the only product in the registry with two
   rows, and would fork `contact_to`, `from_addr`, and the notify route away from
   the row the Gatus client config already uses.
2. In D1, set the origins and the widget secret. A row without origins answers
   `origin_denied` on every submission — both hosts, scheme included, because
   `originAllowed()` string-compares and does no implicit `www`:

   ```sql
   UPDATE products
      SET allowed_origins = '["https://file-viewer.us","https://www.file-viewer.us"]',
          turnstile_ref   = 'TURNSTILE_SECRET_PRODUCTS'
    WHERE slug = 'file_viewer_us';
   ```

   **`turnstile_ref` must name the Products widget's secret, not stay NULL.** The
   mailer falls back to `env.TURNSTILE_SECRET` only when `turnstile_ref` is unset,
   and that secret belongs to a *different* widget — the one `techguywithabeard.com`
   ships (`0x4AAAAAAD5MeaGLtwlOoiYM`). This page sends a Products-widget token
   (`0x4AAAAAAD3zZhlPo_O_mrmP`, the same key `tomatick.us` and `mykk.us` ship, both
   of which set `TURNSTILE_SECRET_PRODUCTS`). Leaving it NULL verifies a Products
   token against the tgwab widget's secret, so every submission dies at
   `siteverify` while the widget itself renders perfectly.
3. Add `file-viewer.us` to the shared Products widget's hostname list, then run
   `notifyctl sync-mailer` — until that runs, the mailer sees none of the above.
   A widget caps at **10 hostnames**; if that one is full, this product needs its
   own widget, its own site key in `support.html`, and a `turnstile_ref` naming a
   secret set on the mailer *first*. A missing hostname renders the widget
   normally and then fails verification.

## Deviations

- §1—footer credit year rendered at build time—this family is static HTML with no build step, so the year is computed at page load from `new Date().getFullYear()`; it is never a literal, which is the failure the rule exists to prevent—2026-08-12—permanent
- §7—contact form posts to a same-origin path—the File Viewer family ships no Pages Functions to proxy through, so the form posts cross-origin to the mailer route §6 names (`mailer.thompsonblack.us/contact/<product>`), authorized by `connect-src` rather than `form-action`—2026-08-12—permanent

## Credits

Card/file-type icons from [vscode-icons](https://github.com/vscode-icons/vscode-icons)
(MIT). Analytics by self-hosted, cookieless [Plausible](https://plausible.io/).
Anti-abuse by [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/);
transactional mail through the house mailer Worker.

## License

[MIT](LICENSE) © 2026 Michal Ferber, aka **TechGuyWithABeard**.
