# File Viewer — the family hub

The home page for the **File Viewer family** of fast, single-file, offline
viewers. One static `index.html` with a **card for each viewer** — drop a file
into the one that fits and it renders locally in your browser, nothing uploaded.

🔗 **Live:** <https://file-viewer.us/>

![Single file](https://img.shields.io/badge/build-single%20HTML%20file-success) ![No build step](https://img.shields.io/badge/build%20step-none-success) ![License](https://img.shields.io/badge/license-MIT-blue)

## The family

Twelve dedicated viewers, listed A→Z (the same order as the **☰ Viewers** menu
in every header):

| Viewer | Site | Handles |
| --- | --- | --- |
| **Cert** | [cert-viewer.us](https://cert-viewer.us/) | X.509 certificates, CSRs & keys — subject/issuer, validity, SANs, fingerprints (`.pem .der .crt .cer .csr`) |
| **Data** | [data-viewer.us](https://data-viewer.us/) | JSON, YAML, CSV, XML & TOML with a collapsible tree + table view |
| **DOCX** | [docx-viewer.us](https://docx-viewer.us/) | Word documents with formatting, styles, tables & images (`.docx`) |
| **EML** | [eml-viewer.us](https://eml-viewer.us/) | Email messages — headers, HTML/plain body, attachments, SPF/DKIM/DMARC (`.eml`) |
| **ePUB** | [epub-viewer.us](https://epub-viewer.us/) | EPUB e-books with chapters, images & styling |
| **HTML** | [html-viewer.us](https://html-viewer.us/) | Rendered HTML plus syntax-highlighted CSS / JS / TS source |
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
- `samples/` — one ready-to-test file per viewer.
- `DESIGN-SPEC.md` — the design & build spec for the whole family.
- `_headers` — Cloudflare Pages security headers (strict CSP).

## Deploy

Static site on Cloudflare Pages: framework preset **None**, build command
blank, output directory `/`. Add the custom domain **file-viewer.us**. Every
viewer deploys the same way from its own repo.

## Credits

Card/file-type icons from [vscode-icons](https://github.com/vscode-icons/vscode-icons)
(MIT). Analytics by self-hosted, cookieless [Plausible](https://plausible.io/).

## License

[MIT](LICENSE) © 2026 Michal Ferber, aka **TechGuyWithABeard**.
