import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class CSRFRule extends BaseRule {
  name = 'csrf';
  description = 'Detects missing CSRF protection in web forms and API endpoints';

  private vulnerablePatterns = [
    // Forms without CSRF token
    /<form[^>]*>[\s\S]*?<\/form>/i,
    // API endpoints without CSRF protection
    /(app\.(post|put|delete|patch))\s*\(['"]([^'"]+)['"]/i,
    /router\.(post|put|delete|patch)\s*\(['"]([^'"]+)['"]/i,
    // Express routes without CSRF middleware
    /(app|router)\.(post|put|delete|patch)\s*\([^,]+,\s*(?!.*csrf)/i
  ];

  private safePatterns = [
    /csrf/i,
    /csrfToken/i,
    /_token/i,
    /authenticity_token/i,
    /X-CSRF-Token/i,
    /csrfProtection/i,
    /verifyCsrfToken/i,
    /@csrf/i,
    /csrf_exempt/i
  ];

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    const content = context.content;

    // Check for forms
    const formMatches = content.matchAll(/<form[^>]*>[\s\S]*?<\/form>/gi);
    for (const match of formMatches) {
      const formContent = match[0];
      const hasCSRF = this.safePatterns.some(pattern => pattern.test(formContent));
      
      if (!hasCSRF && !formContent.includes('method="get"')) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        smells.push(
          this.createSmell(
            'Form missing CSRF protection token',
            context.file,
            'high',
            lineNumber,
            undefined,
            {
              recommendation: 'Add CSRF token to form (e.g., <input type="hidden" name="_token" value="...">)',
              cwe: 'CWE-352',
              owasp: 'A01:2021 – Broken Access Control'
            }
          )
        );
      }
    }

    // Check for API endpoints (Express, Flask, etc.)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip if already has CSRF protection
      if (this.safePatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      // Check for vulnerable route definitions
      if (line.match(/(app|router)\.(post|put|delete|patch)\s*\(/i)) {
        // Check if CSRF middleware is used in surrounding context
        const contextLines = lines.slice(Math.max(0, i - 10), i + 1).join('\n');
        const hasCSRFProtection = this.safePatterns.some(pattern => pattern.test(contextLines));
        
        if (!hasCSRFProtection) {
          smells.push(
            this.createSmell(
              'API endpoint missing CSRF protection',
              context.file,
              'high',
              i + 1,
              undefined,
              {
                recommendation: 'Add CSRF middleware (e.g., csrf() in Express, @csrf_protect in Flask)',
                cwe: 'CWE-352',
                owasp: 'A01:2021 – Broken Access Control'
              }
            )
          );
        }
      }
    }

    return smells;
  }
}

