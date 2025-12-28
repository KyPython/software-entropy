import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class PathTraversalRule extends BaseRule {
  name = 'path-traversal';
  description = 'Detects potential path traversal vulnerabilities';

  private vulnerablePatterns = [
    // Direct file operations with user input
    /(readFile|writeFile|open|fopen|file_get_contents|file_put_contents)\s*\([^,]+,\s*(req\.|request\.|params\.|query\.|body\.)/i,
    /fs\.(readFile|writeFile|readFileSync|writeFileSync)\s*\([^,]+,\s*(req\.|request\.|params\.|query\.|body\.)/i,
    /open\s*\([^,]+,\s*(req\.|request\.|params\.|query\.|body\.)/i,
    
    // Path concatenation without sanitization
    /path\.join\s*\([^)]*req\./i,
    /os\.path\.join\s*\([^)]*req\./i,
    /\+.*req\.(body|params|query)\.[^+]*\+.*['"]\//i,
    
    // Template paths with user input
    /render\s*\([^,]+,\s*\{[^}]*req\./i,
    /include\s*\([^,]+req\./i,
    /require\s*\([^,]+req\./i
  ];

  private safePatterns = [
    /path\.resolve/i,
    /path\.normalize/i,
    /path\.basename/i,
    /sanitize/i,
    /validate/i,
    /whitelist/i,
    /allowed/i,
    /path\.join.*__dirname/i
  ];

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if using safe patterns
      if (this.safePatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      for (const pattern of this.vulnerablePatterns) {
        if (pattern.test(line)) {
          smells.push(
            this.createSmell(
              'Potential path traversal vulnerability: User input used in file operations without sanitization',
              context.file,
              'high',
              i + 1,
              undefined,
              {
                recommendation: 'Sanitize and validate file paths. Use path.resolve(), path.normalize(), or whitelist allowed paths',
                cwe: 'CWE-22',
                owasp: 'A01:2021 – Broken Access Control'
              }
            )
          );
          break;
        }
      }
    }

    return smells;
  }
}

