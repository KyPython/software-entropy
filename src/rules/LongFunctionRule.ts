import { BaseRule } from './Rule';
import { RuleContext, CodeSmell } from '../types';

export class LongFunctionRule extends BaseRule {
  name = 'long-function';
  description = 'Detects functions that exceed the maximum line count threshold';
  
  private maxLines: number;

  constructor(maxLines: number = 50) {
    super();
    this.maxLines = maxLines;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    
    // Simple regex-based function detection (works for JS/TS, Python, Java-like syntax)
    const functionPatterns = [
      /^\s*(export\s+)?(async\s+)?function\s+\w+\s*\(/,
      /^\s*(export\s+)?(async\s+)?const\s+\w+\s*=\s*(async\s+)?\(/,
      /^\s*(export\s+)?(async\s+)?\w+\s*:\s*(async\s+)?\(/,
      /^\s*def\s+\w+\s*\(/,
      /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/
    ];

    let inFunction = false;
    let functionStart = 0;
    let functionName = '';
    let braceDepth = 0;
    let parenDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if this line starts a function
      if (!inFunction) {
        for (const pattern of functionPatterns) {
          if (pattern.test(line)) {
            inFunction = true;
            functionStart = i + 1;
            functionName = this.extractFunctionName(line);
            braceDepth = 0;
            parenDepth = 0;
            break;
          }
        }
      }

      if (inFunction) {
        // Count braces and parentheses to detect function end
        for (const char of line) {
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
        }

        // Function ends when braces are balanced and we're not in a nested structure
        if (braceDepth === 0 && parenDepth === 0 && trimmed.length > 0) {
          const functionLength = i + 1 - functionStart;
          
          if (functionLength > this.maxLines) {
            smells.push(
              this.createSmell(
                `Function "${functionName}" is ${functionLength} lines long (threshold: ${this.maxLines})`,
                context.file,
                functionLength > this.maxLines * 2 ? 'high' : 'medium',
                functionStart,
                undefined,
                { functionName, length: functionLength, threshold: this.maxLines }
              )
            );
          }
          
          inFunction = false;
        }
      }
    }

    return smells;
  }

  private extractFunctionName(line: string): string {
    // Try to extract function name from various patterns
    const patterns = [
      /function\s+(\w+)/,
      /const\s+(\w+)\s*=/,
      /(\w+)\s*:\s*\(/,
      /def\s+(\w+)/,
      /\s+(\w+)\s*\(/
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return 'anonymous';
  }
}

