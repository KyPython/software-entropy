import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class CommandInjectionRule extends BaseRule {
  name = 'command-injection';
  description = 'Detects potential command injection vulnerabilities';

  private vulnerablePatterns = [
    // Shell execution with user input
    /(exec|system|shell_exec|passthru|popen|proc_open)\s*\([^,]+req\./i,
    /child_process\.(exec|execSync|spawn|spawnSync)\s*\([^,]+req\./i,
    /subprocess\.(call|check_call|run|Popen)\s*\([^,]+req\./i,
    /Process\.(Start|start)\s*\([^,]+req\./i,
    
    // Template strings with shell commands
    /`\$\{.*\}.*(rm|ls|cat|grep|find|chmod|chown|sudo)/i,
    /['"]\$\{.*\}.*(rm|ls|cat|grep|find|chmod|chown|sudo)/i,
    
    // eval with user input
    /eval\s*\([^,]+req\./i,
    /Function\s*\([^,]+req\./i
  ];

  private safePatterns = [
    /child_process\.spawn.*\{.*shell:\s*false/i,
    /subprocess\.run.*shell\s*=\s*False/i,
    /escapeshellarg/i,
    /escapeshellcmd/i,
    /shlex\.quote/i,
    /shell_escape/i,
    /sanitize/i,
    /validate/i,
    /whitelist/i
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
              'Potential command injection vulnerability: User input used in shell commands without sanitization',
              context.file,
              'high',
              i + 1,
              undefined,
              {
                recommendation: 'Use parameterized commands, avoid shell execution, or sanitize input (escapeshellarg, shlex.quote)',
                cwe: 'CWE-78',
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

