#!/usr/bin/env node

import { Command } from 'commander';
import { Scanner } from './scanner';
import { createDefaultRules } from './rules';
import { generateReport } from './report';
import { JsonReporter } from './reporters/JsonReporter';
import { PrettyReporter } from './reporters/PrettyReporter';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('software-entropy')
  .description('A code-smell detection CLI tool')
  .version('1.0.0')
  .argument('<directory>', 'Directory to scan')
  .option('-o, --output <file>', 'Output JSON report to file')
  .option('--json', 'Output only JSON (no pretty report)')
  .option('--no-pretty', 'Disable pretty console output')
  .option('--max-function-lines <number>', 'Maximum lines per function', '50')
  .option('--max-file-lines <number>', 'Maximum lines per file', '500')
  .option('--max-todo-density <number>', 'Maximum TODO/FIXME density per 100 lines', '5')
  .option('--include <patterns>', 'Comma-separated glob patterns to include', '**/*.{js,ts,jsx,tsx,py,java,cpp,c,cc,h,hpp}')
  .option('--exclude <patterns>', 'Comma-separated glob patterns to exclude', '**/node_modules/**,**/dist/**,**/build/**,**/.git/**')
  .action(async (directory: string, options) => {
    try {
      const targetDir = path.resolve(directory);
      
      if (!fs.existsSync(targetDir)) {
        console.error(`Error: Directory "${targetDir}" does not exist`);
        process.exit(1);
      }

      if (!fs.statSync(targetDir).isDirectory()) {
        console.error(`Error: "${targetDir}" is not a directory`);
        process.exit(1);
      }

      // Create rules with custom thresholds
      const rules = createDefaultRules();
      const longFunctionRule = rules.find(r => r.name === 'long-function');
      const largeFileRule = rules.find(r => r.name === 'large-file');
      const todoRule = rules.find(r => r.name === 'todo-fixme-density');

      if (longFunctionRule && 'maxLines' in longFunctionRule) {
        (longFunctionRule as any).maxLines = parseInt(options.maxFunctionLines, 10);
      }
      if (largeFileRule && 'maxLines' in largeFileRule) {
        (largeFileRule as any).maxLines = parseInt(options.maxFileLines, 10);
      }
      if (todoRule && 'maxDensity' in todoRule) {
        (todoRule as any).maxDensity = parseFloat(options.maxTodoDensity);
      }

      // Parse include/exclude patterns
      const includePatterns = options.include.split(',').map((p: string) => p.trim());
      const excludePatterns = options.exclude.split(',').map((p: string) => p.trim());

      // Create scanner
      const scanner = new Scanner(rules, {
        includePatterns,
        excludePatterns
      });

      console.log(`Scanning ${targetDir}...`);
      const results = await scanner.scan(targetDir);
      const report = generateReport(results);

      // Output JSON if requested
      if (options.output) {
        const jsonReporter = new JsonReporter();
        jsonReporter.writeToFile(report, path.resolve(options.output));
        console.log(`JSON report written to ${options.output}`);
      }

      // Output pretty report unless disabled
      if (!options.json && options.pretty !== false) {
        const prettyReporter = new PrettyReporter();
        console.log(prettyReporter.generate(report));
      } else if (options.json) {
        const jsonReporter = new JsonReporter();
        console.log(jsonReporter.generate(report));
      }

      // Exit with error code if smells found
      if (report.totalSmells > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

