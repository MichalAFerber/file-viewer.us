# File Viewer — the family hub

The home page for the **File Viewer family** of fast, single-file, offline
viewers. One static `index.html` with a **card for each viewer** — drop a file
into the one that fits and it renders locally in your browser, nothing uploaded.

🔗 **Live:** <https://file-viewer.us/>

| Viewer | Site | Handles |
| --- | --- | --- |
| **HTML** | [html-viewer.us](https://html-viewer.us/) | HTML render + CSS/JS/TS/template source |
| **Markdown** | [markdown-viewer.us](https://markdown-viewer.us/) | Markdown, TXT, RST, AsciiDoc |
| **ePUB** | [epub-viewer.us](https://epub-viewer.us/) | EPUB books |
| **Data** | [data-viewer.us](https://data-viewer.us/) | JSON, YAML, CSV, XML, … |
| **PDF** | [pdf-viewer.us](https://pdf-viewer.us/) | PDF documents |

This repo is also the **canonical home for the shared design system**: see
[`DESIGN-SPEC.md`](DESIGN-SPEC.md) — the single, agent-ready spec for building a
new viewer or bringing an existing one to parity (shared shell + per-viewer
adapter contract + parity checklist).

## What's here

- `index.html` — the hub landing page (self-contained, ~19 KB, no build).
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
