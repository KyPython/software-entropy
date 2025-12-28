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

  async scan(directory: string, specificFiles?: string[]): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const files = specificFiles || await this.findFiles(directory);

    // Process files in parallel batches for better performance
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            return await this.scanFile(file);
          } catch (error) {
            console.error(`Error scanning ${file}:`, error);
            return null;
          }
        })
      );
      
      results.push(...batchResults.filter((r): r is ScanResult => r !== null));
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
    
    // Detect language
    const language = this.detectLanguage(filePath);
    
    // Parse AST based on language
    let ast: any = undefined;
    if (language === 'typescript' || language === 'javascript') {
      try {
        const { parseTypeScript } = await import('./parsers/ast');
        const parsed = parseTypeScript(filePath, content);
        ast = parsed.ast;
      } catch {
        // AST parsing failed, continue without it
      }
    } else if (language === 'python') {
      try {
        const { parsePython } = await import('./parsers/python-ast');
        const parsed = parsePython(filePath, content);
        ast = parsed.ast;
      } catch {
        // AST parsing failed, continue without it
      }
    }
    
    const context: RuleContext = {
      file: filePath,
      content,
      lines,
      ast,
      language
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

  private detectLanguage(filePath: string): 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'unknown' {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.ts' || ext === '.tsx') return 'typescript';
    if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'javascript';
    if (ext === '.py') return 'python';
    if (ext === '.java') return 'java';
    if (ext === '.go') return 'go';
    
    return 'unknown';
  }
}

