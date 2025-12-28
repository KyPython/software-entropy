import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class LongParameterListRule extends BaseRule {
  name = 'long-parameter-list';
  description = 'Detects functions with too many parameters';
  
  private maxParameters: number;

  constructor(maxParameters: number = 5) {
    super();
    this.maxParameters = maxParameters;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    const content = context.content;

    // Find function definitions
    const functionPatterns = [
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      /const\s+(\w+)\s*=\s*(async\s+)?\(([^)]*)\)/g,
      /(\w+)\s*:\s*(async\s+)?\(([^)]*)\)/g,
      /def\s+(\w+)\s*\(([^)]*)\)/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1] || 'anonymous';
        const params = match[2] || match[3] || '';
        
        // Count parameters (handle default values, destructuring, etc.)
        const paramCount = this.countParameters(params);
        
        if (paramCount > this.maxParameters) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          smells.push(
            this.createSmell(
              `Function "${functionName}" has ${paramCount} parameters (threshold: ${this.maxParameters})`,
              context.file,
              paramCount > this.maxParameters * 2 ? 'high' : 'medium',
              lineNumber,
              undefined,
              {
                functionName,
                paramCount,
                threshold: this.maxParameters,
                recommendation: 'Refactor to use an options object or data class to group related parameters'
              }
            )
          );
        }
      }
    }

    return smells;
  }

  private countParameters(params: string): number {
    if (!params.trim()) return 0;

    // Remove comments
    params = params.replace(/\/\/.*$/gm, '');
    params = params.replace(/\/\*[\s\S]*?\*\//g, '');

    // Count commas (basic approach)
    // This is simplified - real parsing would handle destructuring, default values, etc.
    let count = 1; // At least one parameter if params string is not empty
    
    // Count commas, but be careful with nested structures
    let depth = 0;
    for (let i = 0; i < params.length; i++) {
      const char = params[i];
      if (char === '(' || char === '[' || char === '{') {
        depth++;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
      } else if (char === ',' && depth === 0) {
        count++;
      }
    }

    return count;
  }
}

