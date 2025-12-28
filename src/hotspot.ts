import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ScanResult, CodeSmell } from './types';

export interface FileComplexity {
  file: string;
  complexity: number;
  factors: {
    lines: number;
    functions: number;
    classes: number;
    smells: number;
    maxFunctionLength: number;
  };
}

export interface FileChurn {
  file: string;
  churn: number; // Number of changes in time period
  lastModified: string;
  commits: number;
}

export interface Hotspot {
  file: string;
  complexity: number;
  churn: number;
  hotspotScore: number; // Combined score (complexity * churn)
  complexityRank: number;
  churnRank: number;
  hotspotRank: number;
  smells: CodeSmell[];
  stats: {
    lines: number;
    functions: number;
    classes: number;
  };
}

export interface HotspotAnalysis {
  hotspots: Hotspot[];
  topHotspots: Hotspot[]; // Top N by hotspot score
  summary: {
    totalFiles: number;
    highPriorityHotspots: number; // Top 10%
    mediumPriorityHotspots: number; // Next 20%
  };
}

/**
 * Calculate complexity score for a file based on multiple factors
 */
export function calculateComplexity(result: ScanResult): FileComplexity {
  const factors = {
    lines: result.stats.lines,
    functions: result.stats.functions,
    classes: result.stats.classes,
    smells: result.smells.length,
    maxFunctionLength: 0
  };

  // Find max function length from smells
  const functionSmells = result.smells.filter(s => s.rule === 'long-function');
  if (functionSmells.length > 0) {
    const maxLength = Math.max(
      ...functionSmells.map(s => s.metadata?.length || 0)
    );
    factors.maxFunctionLength = maxLength;
  }

  // Weighted complexity calculation
  // Lines: 0.3, Functions: 0.2, Classes: 0.1, Smells: 0.3, Max Function: 0.1
  const complexity = 
    (factors.lines / 1000) * 0.3 +
    (factors.functions / 50) * 0.2 +
    (factors.classes / 20) * 0.1 +
    (factors.smells / 10) * 0.3 +
    (factors.maxFunctionLength / 100) * 0.1;

  return {
    file: result.file,
    complexity: Math.max(0, complexity * 100), // Scale to 0-100
    factors
  };
}

/**
 * Calculate churn (change frequency) for files using git history
 */
export function calculateChurn(
  files: string[],
  timeWindow: string = '30 days ago'
): Map<string, FileChurn> {
  const churnMap = new Map<string, FileChurn>();

  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    // Not a git repo, return empty churn data
    return churnMap;
  }

  // Get the git root directory
  let gitRoot = '';
  try {
    gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    return churnMap; // Not a git repo
  }

  for (const file of files) {
    try {
      // Get relative path from git root
      const relativePath = path.relative(gitRoot, file);
      if (relativePath.startsWith('..')) {
        // File is outside git repo
        churnMap.set(file, { file, churn: 0, lastModified: '', commits: 0 });
        continue;
      }

      // Get file changes in time window
      const gitLog = execSync(
        `git log --since="${timeWindow}" --format="%H" -- "${relativePath}"`,
        { encoding: 'utf-8', cwd: gitRoot }
      );

      const commits = gitLog.trim().split('\n').filter(Boolean);
      const commitCount = commits.length;

      // Get last modification date
      let lastModified = '';
      try {
        const lastCommit = execSync(
          `git log -1 --format="%ai" -- "${relativePath}"`,
          { encoding: 'utf-8', cwd: gitRoot }
        );
        lastModified = lastCommit.trim();
      } catch {
        // File might not be tracked
      }

      // Calculate churn score (commits in time window)
      // Normalize: more commits = higher churn
      const churn = commitCount;

      churnMap.set(file, {
        file,
        churn,
        lastModified,
        commits: commitCount
      });
    } catch (error) {
      // File might not be in git or other error
      churnMap.set(file, {
        file,
        churn: 0,
        lastModified: '',
        commits: 0
      });
    }
  }

  return churnMap;
}

/**
 * Identify hotspots: files with high complexity AND high churn
 */
export function identifyHotspots(
  results: ScanResult[],
  churnData: Map<string, FileChurn>,
  topN: number = 10
): HotspotAnalysis {
  // Calculate complexity for all files
  const complexities = results.map(calculateComplexity);
  
  // Create hotspots
  const hotspots: Hotspot[] = complexities.map(complexity => {
    const churn = churnData.get(complexity.file) || {
      file: complexity.file,
      churn: 0,
      lastModified: '',
      commits: 0
    };

    // Hotspot score = complexity * churn (multiplicative, not additive)
    // This ensures only files that are BOTH complex AND frequently changed score high
    const hotspotScore = complexity.complexity * (churn.churn + 1); // +1 to avoid zero multiplication

    const result = results.find(r => r.file === complexity.file);

    return {
      file: complexity.file,
      complexity: complexity.complexity,
      churn: churn.churn,
      hotspotScore,
      complexityRank: 0, // Will be set after sorting
      churnRank: 0,
      hotspotRank: 0,
      smells: result?.smells || [],
      stats: result?.stats || { lines: 0, functions: 0, classes: 0 }
    };
  });

  // Rank by complexity
  hotspots.sort((a, b) => b.complexity - a.complexity);
  hotspots.forEach((hotspot, index) => {
    hotspot.complexityRank = index + 1;
  });

  // Rank by churn
  hotspots.sort((a, b) => b.churn - a.churn);
  hotspots.forEach((hotspot, index) => {
    hotspot.churnRank = index + 1;
  });

  // Rank by hotspot score (the intersection)
  hotspots.sort((a, b) => b.hotspotScore - a.hotspotScore);
  hotspots.forEach((hotspot, index) => {
    hotspot.hotspotRank = index + 1;
  });

  // Get top hotspots
  const topHotspots = hotspots.slice(0, topN);

  // Categorize by priority
  const total = hotspots.length;
  const highPriorityCount = Math.ceil(total * 0.1); // Top 10%
  const mediumPriorityCount = Math.ceil(total * 0.2); // Next 20%

  return {
    hotspots,
    topHotspots,
    summary: {
      totalFiles: total,
      highPriorityHotspots: Math.min(highPriorityCount, hotspots.filter(h => h.hotspotRank <= highPriorityCount).length),
      mediumPriorityHotspots: Math.min(mediumPriorityCount, hotspots.filter(h => h.hotspotRank > highPriorityCount && h.hotspotRank <= highPriorityCount + mediumPriorityCount).length)
    }
  };
}

/**
 * Get relative file path for display
 */
export function getRelativePath(file: string, baseDir: string = process.cwd()): string {
  try {
    return path.relative(baseDir, file);
  } catch {
    return file;
  }
}

