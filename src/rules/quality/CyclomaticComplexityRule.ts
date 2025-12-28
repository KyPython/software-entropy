import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class CyclomaticComplexityRule extends BaseRule {
  name = 'cyclomatic-complexity';
  description = 'Detects functions with high cyclomatic complexity';
  
  private maxComplexity: number;

  constructor(maxComplexity: number = 10) {
    super();
    this.maxComplexity = maxComplexity;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    const content = context.content;

    // Find functions and calculate complexity
    const functionPatterns = [
      /function\s+(\w+)\s*\(/g,
      /const\s+(\w+)\s*=\s*(async\s+)?\(/g,
      /(\w+)\s*:\s*(async\s+)?\(/g,
      /def\s+(\w+)\s*\(/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1] || 'anonymous';
        const functionStart = this.findFunctionStart(content, match.index);
        const functionEnd = this.findFunctionEnd(content, functionStart);
        
        if (functionStart >= 0 && functionEnd > functionStart) {
          const functionCode = content.substring(functionStart, functionEnd);
          const complexity = this.calculateComplexity(functionCode);
          
          if (complexity > this.maxComplexity) {
            const lineNumber = content.substring(0, functionStart).split('\n').length;
            smells.push(
              this.createSmell(
                `Function "${functionName}" has cyclomatic complexity of ${complexity} (threshold: ${this.maxComplexity})`,
                context.file,
                complexity > this.maxComplexity * 2 ? 'high' : 'medium',
                lineNumber,
                undefined,
                {
                  functionName,
                  complexity,
                  threshold: this.maxComplexity,
                  recommendation: 'Refactor into smaller functions or use early returns to reduce complexity'
                }
            )
            );
          }
        }
      }
    }

    return smells;
  }

  private calculateComplexity(code: string): number {
    // Cyclomatic complexity = 1 + number of decision points
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bdo\s*\{/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g, // Ternary operators
      /\|\|/g, // Logical OR (short-circuit)
      /&&/g // Logical AND (short-circuit)
    ];

    for (const pattern of decisionPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private findFunctionStart(content: string, index: number): number {
    // Find the start of the function (opening brace or colon)
    for (let i = index; i < content.length; i++) {
      if (content[i] === '{' || content[i] === ':') {
        return i;
      }
    }
    return -1;
  }

  private findFunctionEnd(content: string, startIndex: number): number {
    let braceDepth = 0;
    let foundFirstBrace = false;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceDepth++;
        foundFirstBrace = true;
      } else if (content[i] === '}') {
        braceDepth--;
        if (foundFirstBrace && braceDepth === 0) {
          return i + 1;
        }
      }
    }
    return -1;
  }
}

