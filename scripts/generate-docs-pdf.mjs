/**
 * Build PDF from CONFIGURATION.md (+ DEPLOYMENT_HOSTVERGE.md).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const htmlPath = path.join(docsDir, 'configuration-guide.html');
const pdfPath = path.join(docsDir, 'Client-Portal-Configuration-Guide.pdf');

function findBrowser() {
  const candidates = [
    process.env.EDGE_PATH,
    path.join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft/Edge/Application/msedge.exe'),
    path.join(process.env.ProgramFiles ?? '', 'Microsoft/Edge/Application/msedge.exe'),
    path.join(process.env.ProgramFiles ?? '', 'Google/Chrome/Application/chrome.exe'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readMd(filename) {
  const p = path.join(root, filename);
  if (!fs.existsSync(p)) throw new Error(`Missing ${filename}`);
  return fs.readFileSync(p, 'utf8');
}

function stripMdLinksForPdf(md) {
  return md.replace(/\[([^\]]+)\]\(\.\/([^)]+)\)/g, '$1 ($2)');
}

const CSS = `
  @page { margin: 18mm 16mm; }
  body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1e293b;
  }
  h1 { font-size: 22pt; color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 6px; margin-top: 0; }
  h2 { font-size: 15pt; color: #0f172a; margin-top: 1.4em; }
  h3 { font-size: 12pt; color: #334155; margin-top: 1.1em; }
  code, pre { font-family: Consolas, 'Courier New', monospace; font-size: 9pt; }
  code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
  pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
  .cover { text-align: center; padding: 48px 0 32px; page-break-after: always; }
  .cover h1 { border: none; font-size: 26pt; }
  .cover p { color: #64748b; font-size: 12pt; }
  .section-break { page-break-before: always; }
  a { color: #0369a1; }
`;

async function main() {
  const marked = require('marked');
  fs.mkdirSync(docsDir, { recursive: true });

  const configMd = stripMdLinksForPdf(readMd('CONFIGURATION.md'));
  const deployMd = stripMdLinksForPdf(readMd('DEPLOYMENT_HOSTVERGE.md'));

  const bodyHtml = [
    `<div class="cover">`,
    `<h1>Client Portal</h1>`,
    `<p>Configuration &amp; deployment guide</p>`,
    `<p><small>Generated ${new Date().toISOString().slice(0, 10)}</small></p>`,
    `</div>`,
    marked.parse(configMd),
    `<div class="section-break"></div>`,
    marked.parse(deployMd),
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Client Portal — Configuration Guide</title>
  <style>${CSS}</style>
</head>
<body>${bodyHtml}</body>
</html>`;

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('Wrote', htmlPath);

  const executablePath = findBrowser();
  if (!executablePath) {
    console.error('No Edge/Chrome found. Open the HTML file and Print → Save as PDF.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
    });
  } finally {
    await browser.close();
  }

  const sizeKb = Math.round(fs.statSync(pdfPath).size / 1024);
  console.log(`\nPDF ready (${sizeKb} KB):\n  ${pdfPath}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
