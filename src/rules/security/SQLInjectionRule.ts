import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class SQLInjectionRule extends BaseRule {
  name = 'sql-injection';
  description = 'Detects potential SQL injection vulnerabilities from string concatenation';

  private sqlPatterns = [
    // String concatenation with SQL
    /(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|EXEC|EXECUTE)\s+.*\+.*['"]/i,
    /['"].*\+.*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|EXEC|EXECUTE)/i,
    
    // Template literals with SQL (JavaScript/TypeScript)
    /`.*\$\{.*\}.*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i,
    
    // Common vulnerable patterns
    /query\s*[=:]\s*["'].*\+.*['"]/i,
    /sql\s*[=:]\s*["'].*\+.*['"]/i,
    /execute\s*\(.*\+.*['"]/i,
    
    // Python f-strings with SQL
    /f["'].*(SELECT|INSERT|UPDATE|DELETE).*\$\{/i,
    
    // Direct variable interpolation in SQL
    /(SELECT|INSERT|UPDATE|DELETE).*%[sd]|.*\{.*\}.*(SELECT|INSERT|UPDATE|DELETE)/i
  ];

  private safePatterns = [
    // Parameterized queries (safe)
    /\?/,
    /\$\d+/,
    /:[\w]+/,
    /@[\w]+/,
    /prepareStatement/i,
    /executeQuery.*\?/i,
    /parameterized/i,
    /prepared/i
  ];

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    const content = context.content;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if line contains safe patterns (parameterized queries)
      const isSafe = this.safePatterns.some(pattern => pattern.test(line));
      if (isSafe) {
        continue;
      }

      for (const pattern of this.sqlPatterns) {
        if (pattern.test(line)) {
          smells.push(
            this.createSmell(
              'Potential SQL injection vulnerability: String concatenation in SQL query',
              context.file,
              'high',
              i + 1,
              undefined,
              {
                pattern: pattern.source,
                recommendation: 'Use parameterized queries or prepared statements instead of string concatenation',
                cwe: 'CWE-89',
                owasp: 'A03:2021 – Injection'
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

