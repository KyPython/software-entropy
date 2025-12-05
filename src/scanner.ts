import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Rule, RuleContext, ScanResult } from './types';

export interface ScannerOptions {
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFileSize?: number; // in bytes
}

export class Scanner {
  private rules: Rule[];
  private options: ScannerOptions;

  constructor(rules: Rule[], options: ScannerOptions = {}) {
    this.rules = rules.filter(rule => rule.enabled);
    this.options = {
      includePatterns: ['**/*.{js,ts,jsx,tsx,py,java,cpp,c,cc,h,hpp}'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      ...options
    };
  }

  async scan(directory: string): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const files = await this.findFiles(directory);

    for (const file of files) {
      try {
        const result = await this.scanFile(file);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error scanning ${file}:`, error);
      }
    }

    return results;
  }

  private async findFiles(directory: string): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of this.options.includePatterns || []) {
      const files = await glob(pattern, {
        cwd: directory,
        absolute: true,
        ignore: this.options.excludePatterns
      });
      allFiles.push(...files);
    }

    // Remove duplicates and filter by file size
    const uniqueFiles = Array.from(new Set(allFiles));
    const validFiles: string[] = [];

    for (const file of uniqueFiles) {
      try {
        const stats = fs.statSync(file);
        if (stats.isFile() && stats.size <= (this.options.maxFileSize || Infinity)) {
          validFiles.push(file);
        }
      } catch {
        // Skip files we can't stat
      }
    }

    return validFiles;
  }

  private async scanFile(filePath: string): Promise<ScanResult | null> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const context: RuleContext = {
      file: filePath,
      content,
      lines
    };

    const allSmells = this.rules.flatMap(rule => rule.run(context));

    // Calculate basic stats
    const stats = {
      lines: lines.length,
      functions: this.countFunctions(content),
      classes: this.countClasses(content)
    };

    return {
      file: filePath,
      smells: allSmells,
      stats
    };
  }

  private countFunctions(content: string): number {
    const functionPatterns = [
      /function\s+\w+\s*\(/g,
      /const\s+\w+\s*=\s*(async\s+)?\(/g,
      /def\s+\w+\s*\(/g,
      /\w+\s+\w+\s*\(/g
    ];

    let count = 0;
    for (const pattern of functionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  private countClasses(content: string): number {
    const classPatterns = [
      /class\s+\w+/g,
      /export\s+class\s+\w+/g
    ];

    let count = 0;
    for (const pattern of classPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }
}

