import { ScanResult, ScanReport } from './types';

export function generateReport(results: ScanResult[]): ScanReport {
  const summary = {
    byRule: {} as Record<string, number>,
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0
    } as Record<string, number>
  };

  let totalSmells = 0;

  for (const result of results) {
    for (const smell of result.smells) {
      totalSmells++;
      
      // Count by rule
      summary.byRule[smell.rule] = (summary.byRule[smell.rule] || 0) + 1;
      
      // Count by severity
      summary.bySeverity[smell.severity] = (summary.bySeverity[smell.severity] || 0) + 1;
    }
  }

  return {
    scannedAt: new Date().toISOString(),
    totalFiles: results.length,
    totalSmells,
    results,
    summary
  };
}

