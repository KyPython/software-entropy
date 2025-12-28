import { ScanReport } from '../types';

export class HtmlReporter {
  generate(report: ScanReport): string {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Software Entropy Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .summary-card {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
    }
    .summary-card h3 {
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      color: #2c3e50;
    }
    .summary-card.high .value { color: #e74c3c; }
    .summary-card.medium .value { color: #f39c12; }
    .summary-card.low .value { color: #3498db; }
    .results {
      margin-top: 30px;
    }
    .file-result {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
    }
    .file-header {
      background: #34495e;
      color: white;
      padding: 15px 20px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .file-header .smell-count {
      background: rgba(255,255,255,0.2);
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 14px;
    }
    .smells {
      padding: 0;
    }
    .smell {
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: start;
      gap: 15px;
    }
    .smell:last-child {
      border-bottom: none;
    }
    .smell-severity {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .smell-severity.high { background: #fee; color: #c33; }
    .smell-severity.medium { background: #ffeaa7; color: #d63031; }
    .smell-severity.low { background: #dfe6e9; color: #636e72; }
    .smell-content {
      flex: 1;
    }
    .smell-message {
      font-weight: 500;
      margin-bottom: 5px;
    }
    .smell-location {
      color: #666;
      font-size: 14px;
    }
    .smell-recommendation {
      margin-top: 8px;
      padding: 10px;
      background: #f8f9fa;
      border-left: 3px solid #3498db;
      font-size: 14px;
      color: #555;
    }
    .no-smells {
      text-align: center;
      padding: 40px;
      color: #27ae60;
      font-size: 18px;
    }
    .timestamp {
      color: #999;
      font-size: 14px;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Software Entropy Report</h1>
    <div class="summary">
      <div class="summary-card">
        <h3>Total Files</h3>
        <div class="value">${report.totalFiles}</div>
      </div>
      <div class="summary-card">
        <h3>Total Smells</h3>
        <div class="value">${report.totalSmells}</div>
      </div>
      <div class="summary-card high">
        <h3>High Severity</h3>
        <div class="value">${report.summary.bySeverity.high || 0}</div>
      </div>
      <div class="summary-card medium">
        <h3>Medium Severity</h3>
        <div class="value">${report.summary.bySeverity.medium || 0}</div>
      </div>
      <div class="summary-card low">
        <h3>Low Severity</h3>
        <div class="value">${report.summary.bySeverity.low || 0}</div>
      </div>
    </div>

    <div class="results">
      ${report.results.length === 0 
        ? '<div class="no-smells">✅ No code smells detected!</div>'
        : report.results
            .filter(result => result.smells.length > 0)
            .map(result => this.renderFileResult(result))
            .join('')
      }
    </div>

    <div class="timestamp">
      Generated: ${new Date(report.scannedAt).toLocaleString()}
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  private renderFileResult(result: any): string {
    return `
      <div class="file-result">
        <div class="file-header">
          <span>${this.escapeHtml(result.file)}</span>
          <span class="smell-count">${result.smells.length} smell${result.smells.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="smells">
          ${result.smells.map((smell: any) => this.renderSmell(smell)).join('')}
        </div>
      </div>
    `;
  }

  private renderSmell(smell: any): string {
    const recommendation = smell.metadata?.recommendation 
      ? `<div class="smell-recommendation">💡 ${this.escapeHtml(smell.metadata.recommendation)}</div>`
      : '';

    return `
      <div class="smell">
        <span class="smell-severity ${smell.severity}">${smell.severity}</span>
        <div class="smell-content">
          <div class="smell-message">${this.escapeHtml(smell.message)}</div>
          <div class="smell-location">
            ${smell.line ? `Line ${smell.line}` : ''}
            ${smell.rule ? ` • Rule: ${smell.rule}` : ''}
          </div>
          ${recommendation}
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = { innerHTML: '' };
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  writeToFile(report: ScanReport, filePath: string): void {
    const fs = require('fs');
    const html = this.generate(report);
    fs.writeFileSync(filePath, html, 'utf-8');
  }
}

