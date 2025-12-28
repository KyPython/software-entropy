import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class CognitiveComplexityRule extends BaseRule {
  name = 'cognitive-complexity';
  description = 'Detects functions with high cognitive complexity (harder to understand than cyclomatic complexity)';
  
  private maxComplexity: number;

  constructor(maxComplexity: number = 15) {
    super();
    this.maxComplexity = maxComplexity;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    const content = context.content;

    // Find functions
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
          const complexity = this.calculateCognitiveComplexity(functionCode);
          
          if (complexity > this.maxComplexity) {
            const lineNumber = content.substring(0, functionStart).split('\n').length;
            smells.push(
              this.createSmell(
                `Function "${functionName}" has cognitive complexity of ${complexity} (threshold: ${this.maxComplexity})`,
                context.file,
                complexity > this.maxComplexity * 2 ? 'high' : 'medium',
                lineNumber,
                undefined,
                {
                  functionName,
                  complexity,
                  threshold: this.maxComplexity,
                  recommendation: 'Refactor into smaller, more focused functions. Use early returns and guard clauses.'
                }
            )
            );
          }
        }
      }
    }

    return smells;
  }

  private calculateCognitiveComplexity(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = code.split('\n');

    for (const line of lines) {
      // Increase complexity for control flow structures
      if (line.match(/\b(if|else\s+if|switch|for|while|catch)\s*\(/)) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      } else if (line.match(/\belse\b/)) {
        complexity += 1;
      } else if (line.match(/\?\s*.*\s*:/)) {
        // Ternary operators add complexity
        complexity += 1 + nestingLevel;
      } else if (line.match(/\|\||&&/)) {
        // Logical operators add complexity
        complexity += 1;
      }

      // Decrease nesting when we see closing braces
      if (line.match(/\}/)) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    }

    return complexity;
  }

  private findFunctionStart(content: string, index: number): number {
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

