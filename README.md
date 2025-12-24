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
- ⚙️ **Config File Support**: Project-specific configuration via `.code-quality-config.json`
- 🔄 **Incremental Scanning**: Only scan changed files for faster feedback
- 📈 **Baseline Comparison**: Compare against previous scans to track improvements
- 🤖 **CI/CD Integration**: GitHub Actions annotations and proper exit codes
- 📉 **Trend Analysis**: Track code quality over time

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
software-entropy [directory]
```

Or with npx (if installed locally):

```bash
npx software-entropy [directory]
```

If no directory is specified, it defaults to the current directory (`.`).

### Configuration File

Create a `.code-quality-config.json` file in your project root:

```json
{
  "rules": {
    "long-function": {
      "enabled": true,
      "maxLines": 50
    },
    "large-file": {
      "enabled": true,
      "maxLines": 500
    },
    "todo-fixme-density": {
      "enabled": true,
      "maxDensity": 5
    }
  },
  "include": ["**/*.{js,ts,jsx,tsx}"],
  "exclude": ["**/node_modules/**", "**/dist/**"],
  "ci": {
    "annotations": true,
    "failOnHigh": true,
    "failOnMedium": false
  }
}
```

Use the config file:

```bash
software-entropy --config .code-quality-config.json
```

### Incremental Scanning

Only scan files that have changed (requires git):

```bash
software-entropy . --incremental
software-entropy . --incremental --base-ref origin/main
```

### Baseline Comparison

Create a baseline:

```bash
software-entropy . --save-baseline .code-quality-baseline.json
```

Compare against baseline:

```bash
software-entropy . --baseline .code-quality-baseline.json
```

### CI/CD Integration

Enable CI mode for GitHub Actions:

```bash
software-entropy . --ci
```

This will:
- Output GitHub Actions annotations
- Use proper exit codes based on severity
- Provide minimal console output

### CI/CD Integration

**GitHub Actions Example:**
See [.github/workflows/example.yml](./.github/workflows/example.yml) for a complete workflow example that demonstrates:
- Code quality checks in CI
- Incremental scanning on pull requests
- Quality report artifact uploads

#### GitHub Actions

Add to your workflow:

```yaml
- name: Code Quality Check
  run: |
    npm install -g software-entropy
    software-entropy . --ci --fail-on-high
```

Or use the npm script:

```yaml
- name: Code Quality Check
  run: npm run quality:check:ci
```

The `--ci` flag enables:
- GitHub Actions annotations (visible in PR checks)
- Proper exit codes based on severity
- Minimal console output

#### Exit Codes

- `0`: No issues or only low severity issues (if `--fail-on-high` is set)
- `1`: High severity issues found (or medium if `--fail-on-medium` is set)

### Options

- `-c, --config <file>`: Path to config file
- `-o, --output <file>`: Output JSON report to file
- `--json`: Output only JSON (no pretty report)
- `--no-pretty`: Disable pretty console output
- `--max-function-lines <number>`: Maximum lines per function
- `--max-file-lines <number>`: Maximum lines per file
- `--max-todo-density <number>`: Maximum TODO/FIXME density per 100 lines
- `--include <patterns>`: Comma-separated glob patterns to include
- `--exclude <patterns>`: Comma-separated glob patterns to exclude
- `--incremental`: Only scan changed files (requires git)
- `--base-ref <ref>`: Git reference for incremental scanning (default: HEAD)
- `--baseline <file>`: Path to baseline report for comparison
- `--save-baseline <file>`: Save current report as baseline
- `--ci`: Enable CI mode (annotations, proper exit codes)
- `--fail-on-high`: Exit with error code if high severity smells found
- `--fail-on-medium`: Exit with error code if medium severity smells found

### NPM Scripts

Add these to your `package.json`:

**Quick Setup:**
Copy the scripts from [examples/package.json.scripts.example.json](./examples/package.json.scripts.example.json) to your `package.json`.

```json
{
  "scripts": {
    "quality:check": "software-entropy .",
    "quality:check:incremental": "software-entropy . --incremental",
    "quality:check:ci": "software-entropy . --ci",
    "quality:baseline": "software-entropy . --save-baseline .code-quality-baseline.json",
    "quality:compare": "software-entropy . --baseline .code-quality-baseline.json"
  }
}
```

Then run:

```bash
npm run quality:check
npm run quality:check:incremental
npm run quality:check:ci
```

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

# Incremental scan (only changed files)
software-entropy . --incremental

# CI mode with GitHub Actions annotations
software-entropy . --ci --fail-on-high

# Compare with baseline
software-entropy . --baseline .code-quality-baseline.json
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

## Helper Scripts

The project includes helper scripts for common workflows:

```bash
# Full quality check
./scripts/quality-check.sh [directory] [config-file]

# Incremental check (changed files only)
./scripts/quality-check-incremental.sh [base-ref] [config-file]

# Create baseline
./scripts/quality-baseline.sh [baseline-file] [config-file]
```

Make scripts executable:

```bash
chmod +x scripts/*.sh
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

