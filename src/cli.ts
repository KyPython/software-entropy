#!/usr/bin/env node

import { Command } from 'commander';
import { Scanner } from './scanner';
import { createDefaultRules } from './rules';
import { generateReport } from './report';
import { JsonReporter } from './reporters/JsonReporter';
import { PrettyReporter } from './reporters/PrettyReporter';
import { loadConfig } from './config';
import { loadBaseline, saveBaseline, compareWithBaseline } from './baseline';
import { getChangedFiles, filterFilesByChanges } from './incremental';
import { generateCIAnnotations, outputGitHubAnnotations, shouldFailBuild } from './ci-annotations';
import { calculateChurn, identifyHotspots } from './hotspot';
import { HotspotReporter } from './reporters/HotspotReporter';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('software-entropy')
  .description('A code-smell detection CLI tool')
  .version('1.0.0')
  .argument('[directory]', 'Directory to scan (default: current directory)', '.')
  .option('-c, --config <file>', 'Path to config file')
  .option('-o, --output <file>', 'Output JSON report to file')
  .option('--json', 'Output only JSON (no pretty report)')
  .option('--no-pretty', 'Disable pretty console output')
  .option('--max-function-lines <number>', 'Maximum lines per function')
  .option('--max-file-lines <number>', 'Maximum lines per file')
  .option('--max-todo-density <number>', 'Maximum TODO/FIXME density per 100 lines')
  .option('--include <patterns>', 'Comma-separated glob patterns to include')
  .option('--exclude <patterns>', 'Comma-separated glob patterns to exclude')
  .option('--incremental', 'Only scan changed files (requires git)')
  .option('--base-ref <ref>', 'Git reference for incremental scanning (default: HEAD)', 'HEAD')
  .option('--baseline <file>', 'Path to baseline report for comparison')
  .option('--save-baseline <file>', 'Save current report as baseline')
  .option('--ci', 'Enable CI mode (annotations, proper exit codes)')
  .option('--fail-on-high', 'Exit with error code if high severity smells found')
  .option('--fail-on-medium', 'Exit with error code if medium severity smells found')
  .option('--no-hotspots', 'Disable hotspot analysis (enabled by default)')
  .option('--hotspot-window <days>', 'Time window for churn analysis in days (default: 30)', '30')
  .option('--top-hotspots <number>', 'Number of top hotspots to show (default: 10)', '10')
  .action(async (directory: string, options) => {
    try {
      // Load config
      const config = loadConfig(options.config);
      const isCI = options.ci || process.env.CI === 'true';

      const targetDir = path.resolve(directory);
      
      if (!fs.existsSync(targetDir)) {
        console.error(`Error: Directory "${targetDir}" does not exist`);
        process.exit(1);
      }

      if (!fs.statSync(targetDir).isDirectory()) {
        console.error(`Error: "${targetDir}" is not a directory`);
        process.exit(1);
      }

      // Create rules with config or CLI overrides
      const rules = createDefaultRules();
      
      // Apply config to rules
      const longFunctionRule = rules.find(r => r.name === 'long-function');
      const largeFileRule = rules.find(r => r.name === 'large-file');
      const todoRule = rules.find(r => r.name === 'todo-fixme-density');

      if (longFunctionRule) {
        const ruleConfig = config.rules?.['long-function'];
        if (ruleConfig) {
          longFunctionRule.enabled = ruleConfig.enabled ?? true;
          if ('maxLines' in longFunctionRule && ruleConfig.maxLines !== undefined) {
            (longFunctionRule as any).maxLines = ruleConfig.maxLines;
          }
        }
        // CLI override
        if (options.maxFunctionLines) {
          (longFunctionRule as any).maxLines = parseInt(options.maxFunctionLines, 10);
        }
      }

      if (largeFileRule) {
        const ruleConfig = config.rules?.['large-file'];
        if (ruleConfig) {
          largeFileRule.enabled = ruleConfig.enabled ?? true;
          if ('maxLines' in largeFileRule && ruleConfig.maxLines !== undefined) {
            (largeFileRule as any).maxLines = ruleConfig.maxLines;
          }
        }
        // CLI override
        if (options.maxFileLines) {
          (largeFileRule as any).maxLines = parseInt(options.maxFileLines, 10);
        }
      }

      if (todoRule) {
        const ruleConfig = config.rules?.['todo-fixme-density'];
        if (ruleConfig) {
          todoRule.enabled = ruleConfig.enabled ?? true;
          if ('maxDensity' in todoRule && ruleConfig.maxDensity !== undefined) {
            (todoRule as any).maxDensity = ruleConfig.maxDensity;
          }
        }
        // CLI override
        if (options.maxTodoDensity) {
          (todoRule as any).maxDensity = parseFloat(options.maxTodoDensity);
        }
      }

      // Parse include/exclude patterns
      const includePatterns = options.include
        ? options.include.split(',').map((p: string) => p.trim())
        : config.include || ['**/*.{js,ts,jsx,tsx,py,java,cpp,c,cc,h,hpp}'];
      
      const excludePatterns = options.exclude
        ? options.exclude.split(',').map((p: string) => p.trim())
        : config.exclude || ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'];

      // Create scanner
      const scanner = new Scanner(rules, {
        includePatterns,
        excludePatterns
      });

      // Determine files to scan
      let filesToScan: string[] | undefined;
      if (options.incremental) {
        const changedFiles = getChangedFiles(options.baseRef);
        console.log(`Incremental scan: ${changedFiles.added.length + changedFiles.modified.length} changed files`);
        // We'll filter after finding all files
        filesToScan = undefined; // Will be filtered later
      }

      console.log(`Scanning ${targetDir}...`);
      const allFiles = await scanner.scan(targetDir);
      
      // Filter for incremental if needed
      let results = allFiles;
      if (options.incremental) {
        const changedFiles = getChangedFiles(options.baseRef);
        const changedFileList = [...changedFiles.added, ...changedFiles.modified];
        results = allFiles.filter(result => {
          const relativePath = path.relative(targetDir, result.file);
          return changedFileList.some(changed => 
            result.file.includes(changed) || relativePath === changed
          );
        });
        console.log(`Scanned ${results.length} changed files (out of ${allFiles.length} total)`);
      }

      const report = generateReport(results);

      // Load and compare with baseline if provided
      let baselineComparison = null;
      if (options.baseline) {
        const baseline = loadBaseline(options.baseline);
        if (baseline) {
          baselineComparison = compareWithBaseline(report, baseline);
          console.log('\n📊 Baseline Comparison:');
          console.log(`  Total Smells: ${baselineComparison.changes.totalSmells > 0 ? '+' : ''}${baselineComparison.changes.totalSmells}`);
          console.log(`  New Smells: ${baselineComparison.changes.newSmells}`);
          console.log(`  Fixed Smells: ${baselineComparison.changes.fixedSmells}`);
          if (baselineComparison.changes.improvedFiles.length > 0) {
            console.log(`  Improved Files: ${baselineComparison.changes.improvedFiles.length}`);
          }
          if (baselineComparison.changes.regressedFiles.length > 0) {
            console.log(`  Regressed Files: ${baselineComparison.changes.regressedFiles.length}`);
          }
        }
      }

      // Save baseline if requested
      if (options.saveBaseline) {
        saveBaseline(report, options.saveBaseline);
        console.log(`Baseline saved to ${options.saveBaseline}`);
      }

      // Hotspot Analysis (enabled by default - this is the core value proposition)
      let hotspotAnalysis = null;
      const enableHotspots = options.hotspots !== false && !options.noHotspots;
      
      if (enableHotspots && results.length > 0) {
        // Check if git is available for churn analysis
        let hasGit = false;
        try {
          execSync('git rev-parse --git-dir', { stdio: 'ignore' });
          hasGit = true;
        } catch {
          if (!isCI) {
            console.log('\n⚠️  Warning: Not a git repository. Hotspot analysis requires git history.');
            console.log('   Run with --no-hotspots to see traditional report, or initialize git repo.\n');
          }
        }

        if (hasGit) {
          console.log('\n🔥 Analyzing hotspots (complexity × churn)...');
          const timeWindow = `${options.hotspotWindow} days ago`;
          const allFiles = results.map(r => r.file);
          const churnData = calculateChurn(allFiles, timeWindow);
          hotspotAnalysis = identifyHotspots(results, churnData, parseInt(options.topHotspots, 10));
          
          if (!options.json && options.pretty !== false && !isCI) {
            const hotspotReporter = new HotspotReporter();
            console.log('\n' + hotspotReporter.generate(hotspotAnalysis, targetDir));
          }
        }
      }

      // Output JSON if requested
      if (options.output) {
        const jsonReporter = new JsonReporter();
        const reportToSave = baselineComparison
          ? { ...report, baselineComparison }
          : report;
        const reportWithHotspots = hotspotAnalysis
          ? { ...reportToSave, hotspots: { analysis: hotspotAnalysis, timeWindow: `${options.hotspotWindow} days ago`, topN: parseInt(options.topHotspots, 10) } }
          : reportToSave;
        jsonReporter.writeToFile(reportWithHotspots, path.resolve(options.output));
        if (!isCI) {
          console.log(`JSON report written to ${options.output}`);
        }
      }

      // Generate CI annotations
      if (isCI && config.ci?.annotations !== false) {
        const annotations = generateCIAnnotations(report);
        outputGitHubAnnotations(annotations);
      }

      // Output pretty report unless disabled (show after hotspots if enabled)
      const enableHotspots = options.hotspots !== false && !options.noHotspots;
      if (!options.json && options.pretty !== false && !isCI) {
        // Only show detailed report if hotspots are disabled
        // Otherwise hotspots are the primary output
        if (!enableHotspots) {
          const prettyReporter = new PrettyReporter();
          console.log(prettyReporter.generate(report));
        }
      } else if (options.json) {
        const jsonReporter = new JsonReporter();
        const reportToOutput = baselineComparison
          ? { ...report, baselineComparison }
          : report;
        console.log(jsonReporter.generate(reportToOutput));
      } else if (isCI) {
        // Minimal output in CI
        console.log(`Scanned ${report.totalFiles} files, found ${report.totalSmells} code smells`);
        if (report.totalSmells > 0) {
          console.log(`  High: ${report.summary.bySeverity.high || 0}`);
          console.log(`  Medium: ${report.summary.bySeverity.medium || 0}`);
          console.log(`  Low: ${report.summary.bySeverity.low || 0}`);
        }
      }

      // Determine exit code
      const failOnHigh = options.failOnHigh ?? config.ci?.failOnHigh ?? true;
      const failOnMedium = options.failOnMedium ?? config.ci?.failOnMedium ?? false;

      if (shouldFailBuild(report, failOnHigh, failOnMedium)) {
        process.exit(1);
      }

      // Exit with error code if smells found (unless CI mode handles it)
      if (report.totalSmells > 0 && !isCI) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
