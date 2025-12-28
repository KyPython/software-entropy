import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class HardcodedSecretRule extends BaseRule {
  name = 'hardcoded-secret';
  description = 'Detects hardcoded secrets, API keys, passwords, and tokens';

  private secretPatterns = [
    // API Keys
    /(api[_-]?key|apikey)\s*[=:]\s*["']([a-zA-Z0-9_\-]{20,})["']/i,
    /(secret[_-]?key|secretkey)\s*[=:]\s*["']([a-zA-Z0-9_\-]{20,})["']/i,
    
    // Passwords
    /(password|passwd|pwd)\s*[=:]\s*["']([^"']{8,})["']/i,
    
    // Tokens
    /(token|bearer)\s*[=:]\s*["']([a-zA-Z0-9_\-]{20,})["']/i,
    
    // AWS/Azure/GCP keys
    /(aws[_-]?access[_-]?key|aws[_-]?secret)\s*[=:]\s*["']([a-zA-Z0-9_\-/+=]{20,})["']/i,
    /(azure[_-]?key|gcp[_-]?key)\s*[=:]\s*["']([a-zA-Z0-9_\-/+=]{20,})["']/i,
    
    // Database credentials
    /(db[_-]?password|database[_-]?password)\s*[=:]\s*["']([^"']{8,})["']/i,
    
    // JWT secrets
    /(jwt[_-]?secret|jwt[_-]?key)\s*[=:]\s*["']([a-zA-Z0-9_\-/+=]{20,})["']/i,
    
    // Private keys (basic detection)
    /(-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----)/i,
    
    // Common secret patterns
    /(secret|private[_-]?key)\s*[=:]\s*["']([a-zA-Z0-9_\-/+=]{32,})["']/i
  ];

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments that might be examples
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
        // Check if it's clearly an example
        if (line.toLowerCase().includes('example') || 
            line.toLowerCase().includes('demo') ||
            line.toLowerCase().includes('placeholder')) {
          continue;
        }
      }

      for (const pattern of this.secretPatterns) {
        if (pattern.test(line)) {
          // Extract the matched secret (group 2)
          const match = line.match(pattern);
          if (match && match[2]) {
            const secretPreview = match[2].substring(0, 10) + '...';
            
            smells.push(
              this.createSmell(
                `Potential hardcoded secret detected: ${secretPreview}`,
                context.file,
                'high',
                i + 1,
                undefined,
                {
                  pattern: pattern.source,
                  recommendation: 'Move secrets to environment variables or secret management system'
                }
              )
            );
            break; // Only report once per line
          }
        }
      }
    }

    return smells;
  }
}

