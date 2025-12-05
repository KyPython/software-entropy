import chalk from 'chalk';
import { ScanReport, CodeSmell } from '../types';
import * as path from 'path';

export class PrettyReporter {
  generate(report: ScanReport): string {
    const lines: string[] = [];
    
    // Header
    lines.push(chalk.bold.cyan('╔═══════════════════════════════════════════════════════════╗'));
    lines.push(chalk.bold.cyan('║') + chalk.bold.white('           Software Entropy Code Smell Report            ') + chalk.bold.cyan('║'));
    lines.push(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝'));
    lines.push('');
    
    // Summary
    lines.push(chalk.bold('Summary:'));
    lines.push(`  Scanned: ${chalk.cyan(report.totalFiles)} files`);
    lines.push(`  Total Smells: ${this.getSeverityColor(report.totalSmells)(report.totalSmells.toString())}`);
    lines.push(`  Scanned At: ${chalk.gray(report.scannedAt)}`);
    lines.push('');

    // Summary by Severity
    if (Object.keys(report.summary.bySeverity).length > 0) {
      lines.push(chalk.bold('By Severity:'));
      for (const [severity, count] of Object.entries(report.summary.bySeverity)) {
        const color = severity === 'high' ? chalk.red : severity === 'medium' ? chalk.yellow : chalk.gray;
        lines.push(`  ${color(severity.toUpperCase())}: ${count}`);
      }
      lines.push('');
    }

    // Summary by Rule
    if (Object.keys(report.summary.byRule).length > 0) {
      lines.push(chalk.bold('By Rule:'));
      for (const [rule, count] of Object.entries(report.summary.byRule)) {
        lines.push(`  ${chalk.cyan(rule)}: ${count}`);
      }
      lines.push('');
    }

    // Detailed Results
    if (report.results.length > 0) {
      lines.push(chalk.bold('Detailed Results:'));
      lines.push('');

      for (const result of report.results) {
        if (result.smells.length === 0) continue;

        const relativePath = path.relative(process.cwd(), result.file);
        lines.push(chalk.bold.underline(relativePath));
        lines.push(`  Stats: ${result.stats.lines} lines, ${result.stats.functions} functions, ${result.stats.classes} classes`);

        for (const smell of result.smells) {
          const severityColor = this.getSeverityColor(smell.severity);
          const severityBadge = `[${smell.severity.toUpperCase()}]`;
          const location = smell.line ? `:${smell.line}` : '';
          
          lines.push(`  ${severityColor(severityBadge)} ${chalk.cyan(smell.rule)}${location}`);
          lines.push(`    ${chalk.gray(smell.message)}`);
        }
        lines.push('');
      }
    } else {
      lines.push(chalk.green('✓ No code smells detected!'));
      lines.push('');
    }

    return lines.join('\n');
  }

  private getSeverityColor(severity: string | number): (text: string) => string {
    if (typeof severity === 'number') {
      return severity > 0 ? chalk.red : chalk.green;
    }
    
    switch (severity.toLowerCase()) {
      case 'high':
        return chalk.red;
      case 'medium':
        return chalk.yellow;
      case 'low':
        return chalk.gray;
      default:
        return chalk.white;
    }
  }
}

