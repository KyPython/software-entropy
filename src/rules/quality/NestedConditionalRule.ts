import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class NestedConditionalRule extends BaseRule {
  name = 'nested-conditional';
  description = 'Detects deeply nested conditionals that reduce readability';
  
  private maxDepth: number;

  constructor(maxDepth: number = 3) {
    super();
    this.maxDepth = maxDepth;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    let depth = 0;
    let maxDepthInFile = 0;
    let deepestLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count opening braces and conditionals
      const openingBraces = (line.match(/\{/g) || []).length;
      const closingBraces = (line.match(/\}/g) || []).length;
      const conditionals = (line.match(/\b(if|else\s+if|switch|for|while)\s*\(/g) || []).length;

      depth += openingBraces;
      depth += conditionals;
      depth -= closingBraces;

      if (depth > maxDepthInFile) {
        maxDepthInFile = depth;
        deepestLine = i + 1;
      }

      // Check if we exceed threshold
      if (depth > this.maxDepth && deepestLine === i + 1) {
        smells.push(
          this.createSmell(
            `Deeply nested conditionals detected (depth: ${depth}, threshold: ${this.maxDepth})`,
            context.file,
            depth > this.maxDepth * 2 ? 'high' : 'medium',
            i + 1,
            undefined,
            {
              depth,
              threshold: this.maxDepth,
              recommendation: 'Refactor using early returns, guard clauses, or extract methods to reduce nesting'
            }
          )
        );
      }
    }

    return smells;
  }
}

