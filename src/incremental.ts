import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface ChangedFiles {
  added: string[];
  modified: string[];
  deleted: string[];
}

export function getChangedFiles(
  baseRef: string = 'HEAD',
  includeUntracked: boolean = true
): ChangedFiles {
  const result: ChangedFiles = {
    added: [],
    modified: [],
    deleted: []
  };

  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch {
    // Not a git repo, return empty
    return result;
  }

  try {
    // Get modified and deleted files
    const diffOutput = execSync(
      `git diff --name-status ${baseRef}...HEAD`,
      { encoding: 'utf-8' }
    );

    for (const line of diffOutput.trim().split('\n')) {
      if (!line.trim()) continue;
      
      const [status, ...fileParts] = line.split('\t');
      const file = fileParts.join('\t');

      if (status.startsWith('A') || status.startsWith('??')) {
        result.added.push(file);
      } else if (status.startsWith('M')) {
        result.modified.push(file);
      } else if (status.startsWith('D')) {
        result.deleted.push(file);
      }
    }

    // Get untracked files if requested
    if (includeUntracked) {
      try {
        const untrackedOutput = execSync(
          'git ls-files --others --exclude-standard',
          { encoding: 'utf-8' }
        );
        result.added.push(...untrackedOutput.trim().split('\n').filter(Boolean));
      } catch {
        // Ignore errors
      }
    }
  } catch (error) {
    // Git command failed, return empty
    console.warn('Warning: Could not determine changed files:', error);
  }

  return result;
}

export function filterFilesByChanges(
  allFiles: string[],
  changedFiles: ChangedFiles
): string[] {
  const changedSet = new Set([
    ...changedFiles.added,
    ...changedFiles.modified
  ]);

  // Normalize paths for comparison
  const normalizePath = (p: string) => path.resolve(p).replace(/\\/g, '/');

  return allFiles.filter(file => {
    const normalized = normalizePath(file);
    return Array.from(changedSet).some(changed => {
      const normalizedChanged = normalizePath(changed);
      return normalized === normalizedChanged || normalized.includes(normalizedChanged);
    });
  });
}

