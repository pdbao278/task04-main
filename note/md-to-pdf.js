const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

async function convert() {
  // Dynamic import puppeteer
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const mdContent = fs.readFileSync(path.join(__dirname, 'baocao.md'), 'utf-8');
  const htmlBody = marked.parse(mdContent);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
    padding: 0;
    margin: 0;
  }
  h1 { font-size: 22pt; color: #111; border-bottom: 2px solid #c8a03e; padding-bottom: 8px; margin-top: 24px; }
  h2 { font-size: 16pt; color: #222; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
  h3 { font-size: 13pt; color: #333; margin-top: 16px; }
  h4 { font-size: 11pt; color: #444; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { background: #f5f5f0; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; font-family: 'Cascadia Code', Consolas, monospace; }
  pre { background: #f5f5f0; padding: 12px 16px; border-radius: 6px; overflow-x: auto; border: 1px solid #e0ddd6; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #c8a03e; margin: 12px 0; padding: 8px 16px; background: #fefcf5; color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
  th { background: #f5f3ef; border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-weight: 600; }
  td { border: 1px solid #ddd; padding: 6px 10px; }
  tr:nth-child(even) { background: #fafaf8; }
  ul, ol { padding-left: 24px; }
  li { margin-bottom: 4px; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  strong { color: #111; }
  /* Page break helpers */
  h2 { page-break-before: auto; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

  await page.pdf({
    path: path.join(__dirname, 'baocao.pdf'),
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size:8pt;color:#999;text-align:center;width:100%;">Trang <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });

  await browser.close();
  console.log('✅ Đã tạo baocao.pdf');
}

convert().catch(err => { console.error('❌', err); process.exit(1); });
