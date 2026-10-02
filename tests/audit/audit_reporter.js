/**
 * Audit Reporter: Generates structured JSON, Markdown, and HTML reports.
 */

const fs = require('fs');
const path = require('path');

function generateReports(results, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Summary statistics
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let p0Count = 0;
  let p1Count = 0;
  let p2Count = 0;

  const groupedIssues = [];

  for (const pageRes of results) {
    for (const devRes of pageRes.devices) {
      totalChecks++;
      if (devRes.issues.length === 0) {
        passedChecks++;
      } else {
        failedChecks++;
        for (const iss of devRes.issues) {
          if (iss.severity === 'P0') p0Count++;
          else if (iss.severity === 'P1') p1Count++;
          else if (iss.severity === 'P2') p2Count++;

          groupedIssues.push({
            pagePath: pageRes.path,
            pageName: pageRes.name,
            deviceId: devRes.deviceId,
            viewport: devRes.viewport,
            ...iss
          });
        }
      }
    }
  }

  const passRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : '100.0';

  // 1. JSON Report
  const jsonPath = path.join(outputDir, 'audit_report.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats: { totalChecks, passedChecks, failedChecks, passRate: `${passRate}%`, p0Count, p1Count, p2Count },
    results
  }, null, 2), 'utf-8');

  // 2. Markdown Report
  let md = `# Аудит верстки, отступов и типографики ai-avtopilot.ru\n\n`;
  md += `**Дата:** ${new Date().toLocaleDateString('ru-RU')} | **Всего проверок:** ${totalChecks} (${results.length} страниц × 18 устройств)\n`;
  md += `**Результат:** ${passRate}% Pass Rate | **P0 Blocker:** ${p0Count} | **P1 Critical:** ${p1Count} | **P2 Major:** ${p2Count}\n\n`;

  if (groupedIssues.length === 0) {
    md += `> [!NOTE]\n> 🎉 Все 432 проверки пройдены идеально! Ни одного переполнения, среза текста или критического несоответствия тач-зон не обнаружено.\n`;
  } else {
    md += `### Выявленные отклонения:\n\n`;
    md += `| Уровень | Страница | Устройство | Селектор / Тип | Описание проблемы | Рекомендация |\n`;
    md += `|---|---|---|---|---|---|\n`;
    for (const iss of groupedIssues) {
      md += `| **${iss.severity}** | \`${iss.pagePath}\` | ${iss.viewport} | \`${iss.selector || iss.type}\` | ${iss.message} | ${iss.recommendation || '-'} |\n`;
    }
  }

  const mdPath = path.join(outputDir, 'audit_summary.md');
  fs.writeFileSync(mdPath, md, 'utf-8');

  // 3. HTML Report Dashboard
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Отчет аудита верстки и типографики — ai-avtopilot.ru</title>
  <style>
    :root {
      --bg: #090a0f;
      --card-bg: #12141c;
      --card-border: #1e2230;
      --text: #f3f4f6;
      --text-dim: #9ca3af;
      --accent: #3b82f6;
      --p0: #ef4444;
      --p1: #f97316;
      --p2: #eab308;
      --pass: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 32px 24px; }
    .header { max-width: 1300px; margin: 0 auto 32px; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .header p { color: var(--text-dim); font-size: 14px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; max-width: 1300px; margin: 0 auto 32px; }
    .kpi-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 20px; }
    .kpi-val { font-size: 32px; font-weight: 800; }
    .kpi-label { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
    .table-box { max-width: 1300px; margin: 0 auto; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th { background: #161925; padding: 14px 16px; color: var(--text-dim); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; border-bottom: 1px solid var(--card-border); }
    td { padding: 14px 16px; border-bottom: 1px solid var(--card-border); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
    .badge-p0 { background: rgba(239, 68, 68, 0.15); color: var(--p0); border: 1px solid var(--p0); }
    .badge-p1 { background: rgba(249, 115, 22, 0.15); color: var(--p1); border: 1px solid var(--p1); }
    .badge-p2 { background: rgba(234, 179, 8, 0.15); color: var(--p2); border: 1px solid var(--p2); }
    .code { font-family: monospace; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .rec { color: #60a5fa; font-size: 12px; margin-top: 4px; }
    .empty { padding: 48px; text-align: center; color: var(--pass); font-size: 16px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Отчет комплексного Playwright-аудита верстки</h1>
    <p>Сайт: ai-avtopilot.ru | 24 страницы × 18 устройств = ${totalChecks} проверок | Время: ${new Date().toLocaleString('ru-RU')}</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-val" style="color: var(--accent);">${totalChecks}</div>
      <div class="kpi-label">Всего проверок</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color: var(--pass);">${passRate}%</div>
      <div class="kpi-label">Pass Rate</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color: var(--p0);">${p0Count}</div>
      <div class="kpi-label">P0 Блокирующие</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color: var(--p1);">${p1Count}</div>
      <div class="kpi-label">P1 Критические</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val" style="color: var(--p2);">${p2Count}</div>
      <div class="kpi-label">P2 Значительные</div>
    </div>
  </div>

  <div class="table-box">
    ${groupedIssues.length === 0 ? `
      <div class="empty">✔ Дефектов верстки, отступов и типографики не обнаружено. Все проверки успешно пройдены!</div>
    ` : `
      <table>
        <thead>
          <tr>
            <th>Уровень</th>
            <th>Страница</th>
            <th>Устройство / Viewport</th>
            <th>Элемент</th>
            <th>Проблема</th>
            <th>Рекомендация</th>
          </tr>
        </thead>
        <tbody>
          ${groupedIssues.map(iss => `
            <tr>
              <td><span class="badge badge-${iss.severity.toLowerCase()}">${iss.severity}</span></td>
              <td><span class="code">${iss.pagePath}</span></td>
              <td><strong>${iss.deviceId}</strong><br><span style="color:var(--text-dim);font-size:11px;">${iss.viewport}</span></td>
              <td><span class="code">${iss.selector || iss.type}</span></td>
              <td>${iss.message}</td>
              <td class="rec">${iss.recommendation || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `}
  </div>
</body>
</html>`;

  const htmlPath = path.join(outputDir, 'audit_report.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');

  return {
    jsonPath,
    mdPath,
    htmlPath,
    stats: { totalChecks, passedChecks, failedChecks, passRate, p0Count, p1Count, p2Count }
  };
}

module.exports = {
  generateReports
};
