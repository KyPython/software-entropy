import { ScanReport } from '../types';

export class MetricsReporter {
  generatePrometheus(report: ScanReport, labels: Record<string, string> = {}): string {
    const labelString = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    const labelPrefix = labelString ? `{${labelString}}` : '';

    const lines: string[] = [
      '# Software Entropy Metrics (Prometheus format)',
      '# TYPE software_entropy_files_scanned gauge',
      `software_entropy_files_scanned${labelPrefix} ${report.totalFiles}`,
      '',
      '# TYPE software_entropy_smells_total counter',
      `software_entropy_smells_total${labelPrefix} ${report.totalSmells}`,
      '',
      '# TYPE software_entropy_smells_by_severity gauge',
      `software_entropy_smells_by_severity{severity="high"${labelString ? ',' + labelString : ''}} ${report.summary.bySeverity.high || 0}`,
      `software_entropy_smells_by_severity{severity="medium"${labelString ? ',' + labelString : ''}} ${report.summary.bySeverity.medium || 0}`,
      `software_entropy_smells_by_severity{severity="low"${labelString ? ',' + labelString : ''}} ${report.summary.bySeverity.low || 0}`,
      ''
    ];

    // Add metrics by rule
    for (const [rule, count] of Object.entries(report.summary.byRule)) {
      lines.push(`# TYPE software_entropy_smells_by_rule counter`);
      lines.push(`software_entropy_smells_by_rule{rule="${rule}"${labelString ? ',' + labelString : ''}} ${count}`);
      lines.push('');
    }

    // Add file-level metrics
    for (const result of report.results) {
      if (result.smells.length > 0) {
        const fileLabel = `file="${result.file.replace(/"/g, '\\"')}"`;
        lines.push(`# TYPE software_entropy_file_smells gauge`);
        lines.push(`software_entropy_file_smells{${fileLabel}${labelString ? ',' + labelString : ''}} ${result.smells.length}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  writeToFile(report: ScanReport, filePath: string, labels: Record<string, string> = {}): void {
    const fs = require('fs');
    const metrics = this.generatePrometheus(report, labels);
    fs.writeFileSync(filePath, metrics, 'utf-8');
  }
}

