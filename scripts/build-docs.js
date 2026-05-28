const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const outputDir = path.join(docsDir, "export");

// Markdown dokumenty (konvertují se z .md → HTML při každém buildu)
const documents = [];

// HTML dokumenty — jsou přímo ve export/, pouze se tisknou do PDF
const htmlDocuments = [
  { html: path.join(outputDir, "SRS.html"),     pdf: path.join(outputDir, "SRS.pdf") },
  { html: path.join(outputDir, "SDD.html"),     pdf: path.join(outputDir, "SDD.pdf") },
  { html: path.join(outputDir, "PRIRUCKA.html"), pdf: path.join(outputDir, "PRIRUCKA.pdf") },
];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

function closeList(html, state) {
  if (state.inList) {
    html.push("</ul>");
    state.inList = false;
  }
}

function markdownToHtml(markdown) {
  const html = [];
  const state = { inList: false, inCode: false, codeLang: "", code: [] };
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const codeFence = line.match(/^```(.*)$/);

    if (codeFence) {
      if (state.inCode) {
        html.push(`<pre class="code-block ${escapeHtml(state.codeLang)}"><code>${escapeHtml(state.code.join("\n"))}</code></pre>`);
        state.inCode = false;
        state.codeLang = "";
        state.code = [];
      } else {
        closeList(html, state);
        state.inCode = true;
        state.codeLang = codeFence[1].trim();
        state.code = [];
      }
      continue;
    }

    if (state.inCode) {
      state.code.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList(html, state);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList(html, state);
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = line.match(/^\s*-\s+(.+)$/);
    if (bullet) {
      if (!state.inList) {
        html.push("<ul>");
        state.inList = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    closeList(html, state);
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList(html, state);
  return html.join("\n");
}

function renderPage(title, content) {
  return `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm;
    }

    :root {
      color: #172033;
      font-family: "Segoe UI", Arial, sans-serif;
      line-height: 1.55;
      background: #f4f7fb;
    }

    body {
      margin: 0;
      background: #f4f7fb;
    }

    .document {
      max-width: 920px;
      margin: 32px auto;
      padding: 52px 62px;
      background: #ffffff;
      border: 1px solid #dfe7f1;
      border-radius: 10px;
      box-shadow: 0 20px 45px rgba(23, 32, 51, 0.08);
    }

    h1 {
      margin: 0 0 24px;
      padding-bottom: 18px;
      color: #0f3f3c;
      font-size: 32px;
      line-height: 1.15;
      border-bottom: 4px solid #3fb984;
    }

    h2 {
      margin: 34px 0 12px;
      color: #123b56;
      font-size: 22px;
      line-height: 1.25;
      break-after: avoid;
    }

    h3 {
      margin: 24px 0 10px;
      color: #1b516a;
      font-size: 17px;
      break-after: avoid;
    }

    p {
      margin: 0 0 12px;
    }

    ul {
      margin: 0 0 16px 22px;
      padding: 0;
    }

    li {
      margin: 4px 0;
    }

    strong {
      color: #0f3f3c;
    }

    code {
      padding: 2px 5px;
      border-radius: 5px;
      background: #edf3f7;
      color: #0f3f3c;
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.94em;
    }

    .code-block {
      overflow: auto;
      margin: 14px 0 20px;
      padding: 14px 16px;
      border: 1px solid #d9e4ee;
      border-left: 4px solid #3fb984;
      border-radius: 8px;
      background: #f8fbfd;
      white-space: pre-wrap;
      break-inside: avoid;
    }

    .code-block code {
      padding: 0;
      background: transparent;
      color: #25364d;
      font-size: 12px;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .document {
        max-width: none;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }

      h2 {
        page-break-after: avoid;
      }

      .code-block,
      ul,
      p {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <main class="document">
${content}
  </main>
</body>
</html>`;
}

function findChrome() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

fs.mkdirSync(outputDir, { recursive: true });

for (const document of documents) {
  const markdown = fs.readFileSync(document.source, "utf8");
  const html = renderPage(document.title, markdownToHtml(markdown));
  fs.writeFileSync(document.html, html, "utf8");
  console.log(`HTML: ${path.relative(root, document.html)}`);
}

const chrome = findChrome();

if (!chrome) {
  console.warn("PDF export přeskočen: Chrome ani Edge nebyl nalezen.");
  process.exit(0);
}

for (const document of htmlDocuments) {
  if (!fs.existsSync(document.html)) {
    console.warn(`Přeskočeno (soubor neexistuje): ${path.relative(root, document.html)}`);
    continue;
  }
  execFileSync(chrome, [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${document.pdf}`,
    `file:///${document.html.replace(/\\/g, "/")}`,
  ], { stdio: "inherit" });
  console.log(`PDF: ${path.relative(root, document.pdf)}`);
}
