import * as fs from 'fs';
import { ScanReport, CodeSmell } from './types';

export interface BaselineComparison {
  previous: ScanReport;
  current: ScanReport;
  changes: {
    totalSmells: number;
    newSmells: number;
    fixedSmells: number;
    improvedFiles: string[];
    regressedFiles: string[];
  };
}

export function loadBaseline(filePath: string): ScanReport | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as ScanReport;
  } catch (error) {
    console.warn(`Warning: Failed to load baseline from ${filePath}:`, error);
    return null;
  }
}

export function saveBaseline(report: ScanReport, filePath: string): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error: Failed to save baseline to ${filePath}:`, error);
  }
}

export function compareWithBaseline(
  current: ScanReport,
  baseline: ScanReport
): BaselineComparison {
  const currentFileMap = new Map(
    current.results.map(r => [r.file, r])
  );
  const baselineFileMap = new Map(
    baseline.results.map(r => [r.file, r])
  );

  const newSmells: CodeSmell[] = [];
  const fixedSmells: CodeSmell[] = [];
  const improvedFiles: string[] = [];
  const regressedFiles: string[] = [];

  // Check all current files
  for (const [file, currentResult] of currentFileMap) {
    const baselineResult = baselineFileMap.get(file);
    
    if (!baselineResult) {
      // New file - all smells are new
      newSmells.push(...currentResult.smells);
      if (currentResult.smells.length > 0) {
        regressedFiles.push(file);
      }
    } else {
      // Compare smells
      const currentSmellKeys = new Set(
        currentResult.smells.map(s => `${s.rule}:${s.line || 0}:${s.message}`)
      );
      const baselineSmellKeys = new Set(
        baselineResult.smells.map(s => `${s.rule}:${s.line || 0}:${s.message}`)
      );

      // Find new smells
      for (const smell of currentResult.smells) {
        const key = `${smell.rule}:${smell.line || 0}:${smell.message}`;
        if (!baselineSmellKeys.has(key)) {
          newSmells.push(smell);
        }
      }

      // Find fixed smells
      for (const smell of baselineResult.smells) {
        const key = `${smell.rule}:${smell.line || 0}:${smell.message}`;
        if (!currentSmellKeys.has(key)) {
          fixedSmells.push(smell);
        }
      }

      // Track file improvements/regressions
      if (currentResult.smells.length < baselineResult.smells.length) {
        improvedFiles.push(file);
      } else if (currentResult.smells.length > baselineResult.smells.length) {
        regressedFiles.push(file);
      }
    }
  }

  // Check for files that were removed
  for (const [file, baselineResult] of baselineFileMap) {
    if (!currentFileMap.has(file)) {
      // File was removed - all its smells are considered fixed
      fixedSmells.push(...baselineResult.smells);
    }
  }

  return {
    previous: baseline,
    current,
    changes: {
      totalSmells: current.totalSmells - baseline.totalSmells,
      newSmells: newSmells.length,
      fixedSmells: fixedSmells.length,
      improvedFiles,
      regressedFiles
    }
  };
}

