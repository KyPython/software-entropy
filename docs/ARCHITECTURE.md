# Software Entropy Architecture

## Overview

Software Entropy is built with a modular, extensible architecture that prioritizes developer experience and actionable insights.

## Core Components

### 1. Scanner (`src/scanner.ts`)
- **Purpose**: File discovery and orchestration
- **Responsibilities**:
  - File pattern matching (glob-based)
  - File filtering (size, exclude patterns)
  - Parallel file processing
  - Results aggregation

### 2. Rules System (`src/rules/`)
- **Purpose**: Pluggable code analysis rules
- **Architecture**:
  - `BaseRule`: Abstract base class for all rules
  - Rule interface: `name`, `description`, `enabled`, `run(context)`
  - Rule context: `file`, `content`, `lines`, `ast` (optional)
- **Current Rules**:
  - `LongFunctionRule`: Detects functions exceeding line threshold
  - `LargeFileRule`: Detects files exceeding line threshold
  - `TodoFIXMERule`: Detects high TODO/FIXME density

### 3. Hotspot Analysis (`src/hotspot.ts`)
- **Purpose**: Complexity × Churn analysis
- **Components**:
  - `calculateComplexity()`: Multi-factor complexity scoring
  - `calculateChurn()`: Git history-based change frequency
  - `identifyHotspots()`: Combined scoring and ranking
- **Algorithm**: Hotspot Score = Complexity × Churn (multiplicative)

### 4. Reporters (`src/reporters/`)
- **Purpose**: Output formatting
- **Types**:
  - `JsonReporter`: Structured JSON output
  - `PrettyReporter`: Colorized console output
  - `HotspotReporter`: Prioritized hotspot visualization

### 5. Configuration (`src/config.ts`)
- **Purpose**: Project-specific settings
- **Format**: `.code-quality-config.json`
- **Supports**: Rule thresholds, include/exclude patterns, CI settings

### 6. Baseline Comparison (`src/baseline.ts`)
- **Purpose**: Track improvements over time
- **Features**:
  - Save/load baseline reports
  - Compare current vs. baseline
  - Track new/fixed smells
  - Identify improved/regressed files

### 7. Incremental Scanning (`src/incremental.ts`)
- **Purpose**: Fast feedback on changed files
- **Implementation**: Git-based change detection
- **Use Case**: CI/CD pipelines, pre-commit hooks

### 8. CI/CD Integration (`src/ci-annotations.ts`)
- **Purpose**: GitHub Actions integration
- **Features**:
  - GitHub annotations output
  - Proper exit codes
  - Minimal console output in CI

## Data Flow

```
1. CLI Entry Point (src/cli.ts)
   ↓
2. Config Loading (src/config.ts)
   ↓
3. Scanner Initialization (src/scanner.ts)
   ↓
4. File Discovery (glob patterns)
   ↓
5. File Scanning (parallel processing)
   ├─→ Rule Execution (src/rules/)
   └─→ Result Aggregation
   ↓
6. Report Generation (src/report.ts)
   ↓
7. Hotspot Analysis (src/hotspot.ts) [if enabled]
   ├─→ Complexity Calculation
   └─→ Churn Analysis (git history)
   ↓
8. Output Formatting (src/reporters/)
   ├─→ JSON Report
   ├─→ Pretty Console Output
   └─→ Hotspot Report
```

## Extension Points

### Adding New Rules

1. Extend `BaseRule` class
2. Implement `run(context: RuleContext)` method
3. Use `createSmell()` helper for consistent output
4. Register in `src/rules/index.ts`

Example:
```typescript
export class MyCustomRule extends BaseRule {
  name = 'my-custom-rule';
  description = 'Detects my custom code smell';

  run(context: RuleContext): CodeSmell[] {
    // Your detection logic
    return smells;
  }
}
```

### Adding New Reporters

1. Create reporter class
2. Implement `generate(report: ScanReport): string`
3. Export from `src/reporters/index.ts`

### Adding Language Support

1. Add AST parser dependency
2. Extend `RuleContext` with language-specific AST
3. Update scanner to detect language and parse accordingly
4. Add language-specific rules

## Performance Considerations

### Current Optimizations
- Parallel file processing (future)
- Incremental scanning (changed files only)
- File size limits (10MB default)
- Pattern-based matching (fast, but limited)

### Future Optimizations
- AST caching
- Parallel rule execution
- Incremental AST updates
- Rule execution optimization

## Testing Strategy

- **Unit Tests**: Rule logic, hotspot calculations
- **Integration Tests**: Scanner, reporter integration
- **E2E Tests**: CLI workflows, config loading

## Design Principles

1. **CLI-First**: Optimized for developer workflows
2. **Extensible**: Pluggable rules, reporters, analyzers
3. **Fast**: Incremental scanning, optimized execution
4. **Actionable**: Hotspot prioritization over comprehensive coverage
5. **Developer-Friendly**: Simple setup, clear output, helpful errors

