import { LargeFileRule } from '../LargeFileRule';
import { RuleContext } from '../../types';

describe('LargeFileRule', () => {
  let rule: LargeFileRule;

  beforeEach(() => {
    rule = new LargeFileRule(10); // Use 10 lines threshold for testing
  });

  it('should detect files exceeding the line threshold', () => {
    const lines = Array(15).fill('const x = 1;');
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(1);
    expect(smells[0].rule).toBe('large-file');
    expect(smells[0].severity).toBe('medium');
    expect(smells[0].message).toContain('15 lines');
  });

  it('should not detect files within the threshold', () => {
    const lines = Array(5).fill('const x = 1;');
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(0);
  });

  it('should use high severity for files significantly exceeding threshold', () => {
    const lines = Array(25).fill('const x = 1;'); // 2.5x threshold
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(1);
    expect(smells[0].severity).toBe('high');
  });

  it('should include metadata with line count', () => {
    const lines = Array(15).fill('const x = 1;');
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells[0].metadata).toBeDefined();
    expect(smells[0].metadata?.lineCount).toBe(15);
    expect(smells[0].metadata?.threshold).toBe(10);
  });
});

