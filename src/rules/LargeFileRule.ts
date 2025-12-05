import { BaseRule } from './Rule';
import { RuleContext, CodeSmell } from '../types';

export class LargeFileRule extends BaseRule {
  name = 'large-file';
  description = 'Detects files that exceed the maximum line count threshold';
  
  private maxLines: number;

  constructor(maxLines: number = 500) {
    super();
    this.maxLines = maxLines;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lineCount = context.lines.length;

    if (lineCount > this.maxLines) {
      smells.push(
        this.createSmell(
          `File has ${lineCount} lines (threshold: ${this.maxLines})`,
          context.file,
          lineCount > this.maxLines * 2 ? 'high' : 'medium',
          undefined,
          undefined,
          { lineCount, threshold: this.maxLines }
        )
      );
    }

    return smells;
  }
}

