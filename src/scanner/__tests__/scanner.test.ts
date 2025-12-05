import { Scanner } from '../scanner';
import { LongFunctionRule } from '../../rules/LongFunctionRule';
import { LargeFileRule } from '../../rules/LargeFileRule';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Scanner', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'software-entropy-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should scan files in a directory', async () => {
    // Create test files
    const testFile = path.join(tempDir, 'test.js');
    fs.writeFileSync(testFile, 'const x = 1;\nconst y = 2;');

    const rules = [new LargeFileRule(1)];
    const scanner = new Scanner(rules, {
      includePatterns: ['**/*.js'],
      excludePatterns: []
    });

    const results = await scanner.scan(tempDir);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].file).toBe(testFile);
  });

  it('should exclude files matching exclude patterns', async () => {
    // Create test files
    const testFile = path.join(tempDir, 'test.js');
    const excludedDir = path.join(tempDir, 'node_modules');
    fs.mkdirSync(excludedDir);
    const excludedFile = path.join(excludedDir, 'excluded.js');
    
    fs.writeFileSync(testFile, 'const x = 1;');
    fs.writeFileSync(excludedFile, 'const x = 1;');

    const rules = [new LargeFileRule(100)];
    const scanner = new Scanner(rules, {
      includePatterns: ['**/*.js'],
      excludePatterns: ['**/node_modules/**']
    });

    const results = await scanner.scan(tempDir);
    const filePaths = results.map(r => r.file);
    expect(filePaths).toContain(testFile);
    expect(filePaths).not.toContain(excludedFile);
  });

  it('should calculate file stats', async () => {
    const content = `function test() {
  return 1;
}

class Test {
  method() {
    return 2;
  }
}`;

    const testFile = path.join(tempDir, 'test.js');
    fs.writeFileSync(testFile, content);

    const rules = [new LargeFileRule(100)];
    const scanner = new Scanner(rules, {
      includePatterns: ['**/*.js'],
      excludePatterns: []
    });

    const results = await scanner.scan(tempDir);
    expect(results[0].stats.lines).toBeGreaterThan(0);
    expect(results[0].stats.functions).toBeGreaterThan(0);
  });
});

