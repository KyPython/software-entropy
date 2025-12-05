import { generateReport } from '../report';
import { ScanResult } from '../../types';

describe('generateReport', () => {
  it('should generate a report with correct summary', () => {
    const results: ScanResult[] = [
      {
        file: 'test1.js',
        smells: [
          {
            rule: 'long-function',
            severity: 'medium',
            message: 'Function is too long',
            file: 'test1.js',
            line: 10
          },
          {
            rule: 'large-file',
            severity: 'high',
            message: 'File is too large',
            file: 'test1.js'
          }
        ],
        stats: { lines: 100, functions: 5, classes: 1 }
      },
      {
        file: 'test2.js',
        smells: [
          {
            rule: 'todo-fixme-density',
            severity: 'low',
            message: 'High TODO density',
            file: 'test2.js'
          }
        ],
        stats: { lines: 50, functions: 2, classes: 0 }
      }
    ];

    const report = generateReport(results);

    expect(report.totalFiles).toBe(2);
    expect(report.totalSmells).toBe(3);
    expect(report.summary.byRule['long-function']).toBe(1);
    expect(report.summary.byRule['large-file']).toBe(1);
    expect(report.summary.byRule['todo-fixme-density']).toBe(1);
    expect(report.summary.bySeverity.medium).toBe(1);
    expect(report.summary.bySeverity.high).toBe(1);
    expect(report.summary.bySeverity.low).toBe(1);
    expect(report.scannedAt).toBeDefined();
  });

  it('should handle empty results', () => {
    const results: ScanResult[] = [];
    const report = generateReport(results);

    expect(report.totalFiles).toBe(0);
    expect(report.totalSmells).toBe(0);
    expect(Object.keys(report.summary.byRule)).toHaveLength(0);
  });

  it('should aggregate multiple smells of the same rule', () => {
    const results: ScanResult[] = [
      {
        file: 'test.js',
        smells: [
          {
            rule: 'long-function',
            severity: 'medium',
            message: 'Function 1 is too long',
            file: 'test.js',
            line: 10
          },
          {
            rule: 'long-function',
            severity: 'medium',
            message: 'Function 2 is too long',
            file: 'test.js',
            line: 50
          }
        ],
        stats: { lines: 100, functions: 2, classes: 0 }
      }
    ];

    const report = generateReport(results);

    expect(report.totalSmells).toBe(2);
    expect(report.summary.byRule['long-function']).toBe(2);
  });
});

