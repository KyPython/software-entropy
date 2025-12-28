import { BaseRule } from '../Rule';
import { RuleContext, CodeSmell } from '../../types';

export class DuplicateCodeRule extends BaseRule {
  name = 'duplicate-code';
  description = 'Detects duplicate code blocks within a file';
  
  private minLines: number;
  private similarityThreshold: number;

  constructor(minLines: number = 5, similarityThreshold: number = 0.8) {
    super();
    this.minLines = minLines;
    this.similarityThreshold = similarityThreshold;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;

    // Extract code blocks (non-empty, non-comment lines)
    const codeBlocks: Array<{ start: number; end: number; content: string }> = [];
    let blockStart = -1;
    let blockLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isEmpty = line.length === 0;
      const isComment = line.startsWith('//') || line.startsWith('#') || line.startsWith('/*');

      if (!isEmpty && !isComment) {
        if (blockStart === -1) {
          blockStart = i;
        }
        blockLines.push(line);
      } else {
        if (blockLines.length >= this.minLines) {
          codeBlocks.push({
            start: blockStart,
            end: i - 1,
            content: blockLines.join('\n')
          });
        }
        blockStart = -1;
        blockLines = [];
      }
    }

    // Check last block
    if (blockLines.length >= this.minLines) {
      codeBlocks.push({
        start: blockStart >= 0 ? blockStart : lines.length - blockLines.length,
        end: lines.length - 1,
        content: blockLines.join('\n')
      });
    }

    // Compare blocks for duplicates
    for (let i = 0; i < codeBlocks.length; i++) {
      for (let j = i + 1; j < codeBlocks.length; j++) {
        const similarity = this.calculateSimilarity(
          codeBlocks[i].content,
          codeBlocks[j].content
        );

        if (similarity >= this.similarityThreshold) {
          smells.push(
            this.createSmell(
              `Duplicate code block detected (${Math.round(similarity * 100)}% similar). Lines ${codeBlocks[i].start + 1}-${codeBlocks[i].end + 1} and ${codeBlocks[j].start + 1}-${codeBlocks[j].end + 1}`,
              context.file,
              'medium',
              codeBlocks[i].start + 1,
              undefined,
              {
                duplicateAt: codeBlocks[j].start + 1,
                similarity,
                recommendation: 'Extract common code into a reusable function or module'
              }
            )
          );
        }
      }
    }

    return smells;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity based on common lines
    const lines1 = str1.split('\n');
    const lines2 = str2.split('\n');
    
    const maxLength = Math.max(lines1.length, lines2.length);
    if (maxLength === 0) return 0;

    let matches = 0;
    const minLength = Math.min(lines1.length, lines2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (lines1[i].trim() === lines2[i].trim()) {
        matches++;
      }
    }

    return matches / maxLength;
  }
}

