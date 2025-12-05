import { LongFunctionRule } from '../LongFunctionRule';
import { RuleContext } from '../../types';

describe('LongFunctionRule', () => {
  let rule: LongFunctionRule;

  beforeEach(() => {
    rule = new LongFunctionRule(10); // Use 10 lines threshold for testing
  });

  it('should detect functions exceeding the line threshold', () => {
    const content = `function longFunction() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  const f = 6;
  const g = 7;
  const h = 8;
  const i = 9;
  const j = 10;
  const k = 11;
  return a + b + c + d + e + f + g + h + i + j + k;
}`;

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines: content.split('\n')
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(1);
    expect(smells[0].rule).toBe('long-function');
    expect(smells[0].severity).toBe('medium');
    expect(smells[0].message).toContain('longFunction');
  });

  it('should not detect functions within the threshold', () => {
    const content = `function shortFunction() {
  const a = 1;
  const b = 2;
  return a + b;
}`;

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines: content.split('\n')
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(0);
  });

  it('should detect arrow functions', () => {
    const content = `const longArrow = () => {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  const f = 6;
  const g = 7;
  const h = 8;
  const i = 9;
  const j = 10;
  const k = 11;
  return a + b + c + d + e + f + g + h + i + j + k;
}`;

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines: content.split('\n')
    };

    const smells = rule.run(context);
    expect(smells.length).toBeGreaterThan(0);
  });

  it('should handle multiple functions', () => {
    const content = `function short() {
  return 1;
}

function long() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 4;
  const e = 5;
  const f = 6;
  const g = 7;
  const h = 8;
  const i = 9;
  const j = 10;
  const k = 11;
  return a + b;
}`;

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines: content.split('\n')
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(1);
  });
});

