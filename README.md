# Software Entropy

[![CI](https://github.com/KyPython/software-entropy/actions/workflows/ci.yml/badge.svg)](https://github.com/KyPython/software-entropy/actions/workflows/ci.yml)
[![CodeQL](https://github.com/KyPython/software-entropy/actions/workflows/codeql.yml/badge.svg)](https://github.com/KyPython/software-entropy/actions/workflows/codeql.yml)

A code-smell detection CLI tool that scans code repositories for common issues like long functions, large files, and TODO/FIXME density.

## Features

- 🔍 **Pluggable Rule System**: Easy to extend with custom rules
- 📊 **Multiple Output Formats**: JSON and pretty console output
- 🎯 **Common Code Smells**: Detects long functions, large files, TODO/FIXME density
- 🧪 **Well Tested**: Comprehensive Jest test suite
- ⚡ **Fast**: Efficient scanning with configurable file patterns

## Installation

### Global Installation (Recommended)

Install globally to use `software-entropy` from anywhere:

```bash
npm install -g software-entropy
```

### Local Installation

Install as a dev dependency in your project:

```bash
npm install --save-dev software-entropy
```

Then use it with `npx`:

```bash
npx software-entropy <directory>
```

### Development Setup

To contribute or run from source:

```bash
git clone https://github.com/KyPython/software-entropy.git
cd software-entropy
npm install
npm run build
```

## Usage

### Basic Usage

After global installation:

```bash
software-entropy <directory>
```

Or with npx (if installed locally):

```bash
npx software-entropy <directory>
```

### Options

- `-o, --output <file>`: Output JSON report to file
- `--json`: Output only JSON (no pretty report)
- `--no-pretty`: Disable pretty console output
- `--max-function-lines <number>`: Maximum lines per function (default: 50)
- `--max-file-lines <number>`: Maximum lines per file (default: 500)
- `--max-todo-density <number>`: Maximum TODO/FIXME density per 100 lines (default: 5)
- `--include <patterns>`: Comma-separated glob patterns to include
- `--exclude <patterns>`: Comma-separated glob patterns to exclude

### Examples

```bash
# Scan current directory
software-entropy .

# Scan with custom thresholds
software-entropy ./src --max-function-lines 30 --max-file-lines 300

# Output JSON report
software-entropy ./src -o report.json

# JSON only output
software-entropy ./src --json

# Custom include/exclude patterns
software-entropy . --include "**/*.{ts,tsx}" --exclude "**/node_modules/**,**/dist/**"
```

## Rules

### Long Function Rule

Detects functions that exceed a specified line count threshold.

**Default threshold**: 50 lines

### Large File Rule

Detects files that exceed a specified line count threshold.

**Default threshold**: 500 lines

### TODO/FIXME Density Rule

Detects files with high density of TODO, FIXME, XXX, HACK, or NOTE comments.

**Default threshold**: 5% (5 per 100 lines)

## Creating Custom Rules

Rules implement the `Rule` interface and extend `BaseRule`:

```typescript
import { BaseRule } from './rules/Rule';
import { RuleContext, CodeSmell } from './types';

export class MyCustomRule extends BaseRule {
  name = 'my-custom-rule';
  description = 'Detects my custom code smell';

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    
    // Your detection logic here
    if (/* condition */) {
      smells.push(
        this.createSmell(
          'Your message here',
          context.file,
          'medium', // or 'low' or 'high'
          lineNumber, // optional
          columnNumber, // optional
          { /* optional metadata */ }
        )
      );
    }
    
    return smells;
  }
}
```

Then add your rule to the scanner:

```typescript
import { Scanner } from './scanner';
import { MyCustomRule } from './rules/MyCustomRule';

const rules = [new MyCustomRule()];
const scanner = new Scanner(rules);
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Project Structure

```
software-entropy/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── scanner.ts          # Core scanning engine
│   ├── report.ts           # Report generation
│   ├── types.ts            # TypeScript type definitions
│   ├── rules/              # Pluggable rules
│   │   ├── Rule.ts         # Base rule class
│   │   ├── LongFunctionRule.ts
│   │   ├── LargeFileRule.ts
│   │   ├── TodoFIXMERule.ts
│   │   └── index.ts
│   └── reporters/          # Report generators
│       ├── JsonReporter.ts
│       ├── PrettyReporter.ts
│       └── index.ts
├── dist/                   # Compiled output
└── tests/                  # Test files
```

## License

MIT

