import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class MagicNumberRule extends BaseRule {
  name = 'magic-number';
  description = 'Detects magic numbers that should be named constants';
  
  private allowedNumbers = new Set([0, 1, -1, 2, 100, 1000]); // Common exceptions

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    // Pattern to find numbers (integers and decimals)
    const numberPattern = /\b(\d+\.?\d*)\b/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
        continue;
      }

      // Skip common patterns that are usually fine
      if (line.includes('version') || 
          line.includes('index') || 
          line.includes('length') ||
          line.includes('size') ||
          line.includes('count') ||
          line.match(/^\s*\/\//) || // Comment line
          line.match(/^\s*#/)) { // Python comment
        continue;
      }

      let match;
      while ((match = numberPattern.exec(line)) !== null) {
        const number = parseFloat(match[1]);
        
        // Skip allowed numbers and very small decimals
        if (this.allowedNumbers.has(number) || 
            (number < 1 && number > 0 && number.toString().includes('.'))) {
          continue;
        }

        // Skip numbers that are clearly part of version strings, dates, etc.
        if (line.match(/v?\d+\.\d+\.\d+/) || // Version numbers
            line.match(/\d{4}-\d{2}-\d{2}/) || // Dates
            line.match(/\d{1,2}:\d{2}/)) { // Time
          continue;
        }

        // Check if number is in a context that suggests it's a magic number
        const lineContext = line.substring(Math.max(0, match.index - 20), match.index + 20);
        
        // If it's a standalone number (not part of a larger expression), it's likely magic
        if (number >= 3 && number <= 1000 && !lineContext.includes('const') && !lineContext.includes('=')) {
          smells.push(
            this.createSmell(
              `Magic number detected: ${number}. Consider extracting to a named constant`,
              context.file,
              'low',
              i + 1,
              match.index || undefined,
              {
                number,
                recommendation: `Extract ${number} to a named constant with descriptive name`
              }
            )
          );
        }
      }
    }

    return smells;
  }
}

