import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class AuthenticationFlawRule extends BaseRule {
  name = 'authentication-flaw';
  description = 'Detects common authentication and authorization flaws';

  private vulnerablePatterns = [
    // Hardcoded credentials
    /(password|passwd|pwd)\s*[=:]\s*["']([^"']{3,})["']/i,
    /(username|user)\s*[=:]\s*["'](admin|root|test|guest)["']/i,
    
    // Weak password comparison
    /password\s*==\s*["']/i,
    /password\s*===/i,
    
    // Missing authentication checks
    /(function|def|async\s+function)\s+\w+\s*\([^)]*req[^)]*\)/i,
    
    // Direct database queries without auth
    /(SELECT|INSERT|UPDATE|DELETE).*FROM.*WHERE.*(user_id|id)\s*=\s*req\./i,
    
    // Session fixation
    /session\[['"]id['"]\]\s*=\s*req\./i,
    
    // Weak session management
    /session\[['"]user['"]\]\s*=\s*req\.(body|query|params)\./i
  ];

  private safePatterns = [
    /bcrypt/i,
    /argon2/i,
    /scrypt/i,
    /pbkdf2/i,
    /password_hash/i,
    /verify_password/i,
    /authenticate/i,
    /isAuthenticated/i,
    /requireAuth/i,
    /middleware.*auth/i,
    /@login_required/i,
    /@require_auth/i
  ];

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
        continue;
      }

      // Skip if using safe patterns
      if (this.safePatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      // Check for hardcoded credentials
      if (line.match(/(password|passwd|pwd)\s*[=:]\s*["']([^"']{3,})["']/i)) {
        const match = line.match(/(password|passwd|pwd)\s*[=:]\s*["']([^"']{3,})["']/i);
        if (match && !match[2].match(/^\$\{?|process\.env/i)) {
          smells.push(
            this.createSmell(
              'Potential hardcoded password detected',
              context.file,
              'high',
              i + 1,
              undefined,
              {
                recommendation: 'Use environment variables or secure credential storage',
                cwe: 'CWE-798',
                owasp: 'A07:2021 – Identification and Authentication Failures'
              }
            )
          );
        }
      }

      // Check for weak password comparison
      if (line.match(/password\s*==\s*["']/i) || line.match(/password\s*===/i)) {
        smells.push(
          this.createSmell(
            'Weak password comparison detected (use constant-time comparison)',
            context.file,
            'high',
            i + 1,
            undefined,
            {
              recommendation: 'Use secure password comparison (bcrypt.compare, constant-time comparison)',
              cwe: 'CWE-208',
              owasp: 'A07:2021 – Identification and Authentication Failures'
            }
          )
        );
      }

      // Check for missing authentication in route handlers
      if (line.match(/(app|router)\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/i)) {
        const contextLines = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
        const hasAuth = /auth|login|authenticate|requireAuth|@login_required/i.test(contextLines);
        
        if (!hasAuth && line.match(/['"]\/(admin|api|private|secure)/i)) {
          smells.push(
            this.createSmell(
              'Route handler may be missing authentication check',
              context.file,
              'medium',
              i + 1,
              undefined,
              {
                recommendation: 'Add authentication middleware or decorator',
                cwe: 'CWE-306',
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

