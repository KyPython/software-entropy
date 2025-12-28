import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class DeadCodeRule extends BaseRule {
  name = 'dead-code';
  description = 'Detects potentially unused code (unreachable code, unused functions)';

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    const content = context.content;

    // Detect unreachable code after return/throw/break/continue
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1].trim();

      // Check for return/throw/break/continue followed by non-comment code
      if (line.match(/\b(return|throw|break|continue)\s*[;}]/)) {
        // Next line should be empty, comment, or closing brace
        if (nextLine && 
            !nextLine.match(/^\s*$/) && 
            !nextLine.match(/^\s*\/\//) && 
            !nextLine.match(/^\s*#/) &&
            !nextLine.match(/^\s*[}\]]/) &&
            !nextLine.match(/^\s*else\b/) &&
            !nextLine.match(/^\s*catch\s*\(/)) {
          smells.push(
            this.createSmell(
              'Potentially unreachable code after return/throw/break/continue',
              context.file,
              'medium',
              i + 2,
              undefined,
              {
                recommendation: 'Remove unreachable code or restructure logic'
              }
            )
          );
        }
      }
    }

    return smells;
  }
}

