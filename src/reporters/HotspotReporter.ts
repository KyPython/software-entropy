import chalk from 'chalk';
import { HotspotAnalysis } from '../hotspot';
import { getRelativePath } from '../hotspot';

export class HotspotReporter {
  generate(analysis: HotspotAnalysis, baseDir: string = process.cwd()): string {
    const lines: string[] = [];
    
    // Header
    lines.push(chalk.bold.red('╔═══════════════════════════════════════════════════════════╗'));
    lines.push(chalk.bold.red('║') + chalk.bold.white('              🔥 HOTSPOT ANALYSIS 🔥                  ') + chalk.bold.red('║'));
    lines.push(chalk.bold.red('╚═══════════════════════════════════════════════════════════╝'));
    lines.push('');
    
    lines.push(chalk.bold.yellow('Why Hotspots Matter:'));
    lines.push('  SonarQube says: "You have 50,000 bad lines of code."');
    lines.push('  Software Entropy says: "Fix these hotspots first."');
    lines.push('');
    lines.push(chalk.gray('  Hotspots = Complex Code × Frequent Changes'));
    lines.push(chalk.gray('  These files are both hard to maintain AND you touch them often.'));
    lines.push('');

    // Summary
    lines.push(chalk.bold('Summary:'));
    lines.push(`  Total Files Analyzed: ${chalk.cyan(analysis.summary.totalFiles)}`);
    lines.push(`  🔴 High Priority Hotspots: ${chalk.red(analysis.summary.highPriorityHotspots)} (Top 10%)`);
    lines.push(`  🟡 Medium Priority Hotspots: ${chalk.yellow(analysis.summary.mediumPriorityHotspots)} (Next 20%)`);
    lines.push('');

    // Top Hotspots
    if (analysis.topHotspots.length > 0) {
      lines.push(chalk.bold.red('🔥 TOP HOTSPOTS (Fix These First):'));
      lines.push('');

      for (let i = 0; i < analysis.topHotspots.length; i++) {
        const hotspot = analysis.topHotspots[i];
        const relativePath = getRelativePath(hotspot.file, baseDir);
        
        // Priority indicator
        let priorityIcon = '  ';
        let priorityColor = chalk.white;
        if (hotspot.hotspotRank <= analysis.summary.highPriorityHotspots) {
          priorityIcon = '🔴';
          priorityColor = chalk.red;
        } else if (hotspot.hotspotRank <= analysis.summary.highPriorityHotspots + analysis.summary.mediumPriorityHotspots) {
          priorityIcon = '🟡';
          priorityColor = chalk.yellow;
        }

        lines.push(`${priorityIcon} ${priorityColor.bold(`#${hotspot.hotspotRank}`)} ${chalk.bold.underline(relativePath)}`);
        lines.push(`     Hotspot Score: ${chalk.red.bold(hotspot.hotspotScore.toFixed(2))} (Complexity: ${hotspot.complexity.toFixed(1)} × Churn: ${hotspot.churn})`);
        lines.push(`     Complexity Rank: ${chalk.cyan(`#${hotspot.complexityRank}`)} | Churn Rank: ${chalk.cyan(`#${hotspot.churnRank}`)}`);
        lines.push(`     Stats: ${hotspot.stats.lines} lines, ${hotspot.stats.functions} functions, ${hotspot.stats.classes} classes`);
        lines.push(`     Code Smells: ${hotspot.smells.length > 0 ? chalk.red(hotspot.smells.length) : chalk.green('0')}`);
        
        if (hotspot.smells.length > 0) {
          const highSeverity = hotspot.smells.filter(s => s.severity === 'high').length;
          const mediumSeverity = hotspot.smells.filter(s => s.severity === 'medium').length;
          if (highSeverity > 0 || mediumSeverity > 0) {
            lines.push(`     Severity: ${highSeverity > 0 ? chalk.red(`${highSeverity} high`) : ''}${highSeverity > 0 && mediumSeverity > 0 ? ', ' : ''}${mediumSeverity > 0 ? chalk.yellow(`${mediumSeverity} medium`) : ''}`);
          }
        }
        lines.push('');
      }
    } else {
      lines.push(chalk.green('✓ No hotspots detected!'));
      lines.push('');
    }

    // Action Items
    if (analysis.topHotspots.length > 0) {
      lines.push(chalk.bold('💡 Recommended Actions:'));
      lines.push(`  1. Start with the top ${Math.min(5, analysis.topHotspots.length)} hotspots`);
      lines.push('  2. Refactor complex functions in these files');
      lines.push('  3. Add tests before refactoring');
      lines.push('  4. Consider breaking large files into smaller modules');
      lines.push('  5. Document complex logic');
      lines.push('');
    }

    return lines.join('\n');
  }
}

