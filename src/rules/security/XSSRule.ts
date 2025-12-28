import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class XSSRule extends BaseRule {
  name = 'xss';
  description = 'Detects potential Cross-Site Scripting (XSS) vulnerabilities';

  private dangerousPatterns = [
    // innerHTML with user input
    /\.innerHTML\s*=\s*.*(\+|\$\{).*['"]/,
    /\.innerHTML\s*=\s*.*(req\.|request\.|params\.|query\.|body\.)/,
    
    // document.write with variables
    /document\.write\s*\(.*(\+|\$\{).*['"]/,
    /document\.writeln\s*\(.*(\+|\$\{).*['"]/,
    
    // eval with user input
    /eval\s*\(.*(req\.|request\.|params\.|query\.|body\.|getParameter)/,
    /eval\s*\(.*(\+|\$\{).*['"]/,
    
    // React dangerouslySetInnerHTML
    /dangerouslySetInnerHTML.*\{.*(req\.|request\.|params\.|query\.|body\.)/,
    
    // jQuery html() with variables
    /\.html\s*\(.*(\+|\$\{).*['"]/,
    
    // Template rendering without escaping
    /render\s*\(.*(req\.|request\.|params\.|query\.|body\.).*\)/,
    /template.*\+.*(req\.|request\.|params\.|query\.|body\.)/
  ];

  private safePatterns = [
    // Safe alternatives
    /\.textContent/,
    /\.innerText/,
    /\.text\(/,
    /escape\(/,
    /encodeURIComponent\(/,
    /sanitize\(/,
    /escapeHtml\(/,
    /DOMPurify/,
    /xss\(/,
    /htmlspecialchars/,
    /htmlentities/
  ];

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if line contains safe patterns
      const isSafe = this.safePatterns.some(pattern => pattern.test(line));
      if (isSafe) {
        continue;
      }

      for (const pattern of this.dangerousPatterns) {
        if (pattern.test(line)) {
          smells.push(
            this.createSmell(
              'Potential XSS vulnerability: User input rendered without sanitization',
              context.file,
              'high',
              i + 1,
              undefined,
              {
                pattern: pattern.source,
                recommendation: 'Sanitize user input before rendering. Use textContent instead of innerHTML, or use a sanitization library like DOMPurify',
                cwe: 'CWE-79',
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

