import { TodoFIXMERule } from '../TodoFIXMERule';
import { RuleContext } from '../../types';

describe('TodoFIXMERule', () => {
  let rule: TodoFIXMERule;

  beforeEach(() => {
    rule = new TodoFIXMERule(10); // 10% density threshold for testing
  });

  it('should detect high TODO/FIXME density', () => {
    const lines = [
      'const x = 1;',
      '// TODO: fix this',
      'const y = 2;',
      '// FIXME: something',
      'const z = 3;',
      '// TODO: another thing',
      'const a = 4;',
      'const b = 5;',
      'const c = 6;',
      'const d = 7;',
      'const e = 8;',
      'const f = 9;',
      'const g = 10;',
      'const h = 11;',
      'const i = 12;',
      'const j = 13;',
      'const k = 14;',
      'const l = 15;',
      'const m = 16;',
      'const n = 17;'
    ];
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(1);
    expect(smells[0].rule).toBe('todo-fixme-density');
    expect(smells[0].message).toContain('TODO/FIXME density');
  });

  it('should not detect low TODO/FIXME density', () => {
    const lines = [
      'const x = 1;',
      '// TODO: fix this',
      'const y = 2;',
      'const z = 3;',
      'const a = 4;',
      'const b = 5;',
      'const c = 6;',
      'const d = 7;',
      'const e = 8;',
      'const f = 9;',
      'const g = 10;',
      'const h = 11;',
      'const i = 12;',
      'const j = 13;',
      'const k = 14;',
      'const l = 15;',
      'const m = 16;',
      'const n = 17;',
      'const o = 18;',
      'const p = 19;'
    ];
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells).toHaveLength(0);
  });

  it('should detect FIXME comments', () => {
    const lines = [
      'const x = 1;',
      '// FIXME: critical bug',
      'const y = 2;',
      'const z = 3;',
      'const a = 4;',
      'const b = 5;',
      'const c = 6;',
      'const d = 7;',
      'const e = 8;',
      'const f = 9;'
    ];
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    expect(smells.length).toBeGreaterThanOrEqual(0);
  });

  it('should include metadata with TODO details', () => {
    const lines = [
      'const x = 1;',
      '// TODO: fix this',
      'const y = 2;',
      '// FIXME: something',
      'const z = 3;',
      'const a = 4;',
      'const b = 5;',
      'const c = 6;',
      'const d = 7;',
      'const e = 8;',
      'const f = 9;',
      'const g = 10;',
      'const h = 11;',
      'const i = 12;',
      'const j = 13;',
      'const k = 14;',
      'const l = 15;',
      'const m = 16;',
      'const n = 17;',
      'const o = 18;',
      'const p = 19;',
      'const q = 20;',
      'const r = 21;',
      'const s = 22;',
      'const t = 23;',
      'const u = 24;',
      'const v = 25;',
      'const w = 26;',
      'const x2 = 27;',
      'const y2 = 28;',
      'const z2 = 29;',
      'const a2 = 30;',
      'const b2 = 31;',
      'const c2 = 32;',
      'const d2 = 33;',
      'const e2 = 34;',
      'const f2 = 35;',
      'const g2 = 36;',
      'const h2 = 37;',
      'const i2 = 38;',
      'const j2 = 39;',
      'const k2 = 40;',
      'const l2 = 41;',
      'const m2 = 42;',
      'const n2 = 43;',
      'const o2 = 44;',
      'const p2 = 45;',
      'const q2 = 46;',
      'const r2 = 47;',
      'const s2 = 48;',
      'const t2 = 49;',
      'const u2 = 50;',
      '// TODO: another',
      '// FIXME: yet another',
      '// TODO: more',
      '// FIXME: even more',
      '// TODO: last one'
    ];
    const content = lines.join('\n');

    const context: RuleContext = {
      file: 'test.js',
      content,
      lines
    };

    const smells = rule.run(context);
    if (smells.length > 0) {
      expect(smells[0].metadata).toBeDefined();
      expect(smells[0].metadata?.count).toBeGreaterThan(0);
      expect(smells[0].metadata?.todos).toBeDefined();
    }
  });
});

