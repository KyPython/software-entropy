import * as fs from 'fs';
import * as path from 'path';

export interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'dev' | 'peer' | 'optional';
  manager: 'npm' | 'yarn' | 'pip' | 'maven' | 'gradle' | 'go' | 'cargo';
}

export interface DependencyScanResult {
  file: string;
  manager: string;
  dependencies: Dependency[];
  hasLockfile: boolean;
}

/**
 * Scan for package.json (npm/yarn)
 */
export function scanNpmDependencies(filePath: string): DependencyScanResult | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);
    
    const dependencies: Dependency[] = [];
    
    // Direct dependencies
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        dependencies.push({
          name,
          version: version as string,
          type: 'direct',
          manager: 'npm'
        });
      }
    }
    
    // Dev dependencies
    if (pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        dependencies.push({
          name,
          version: version as string,
          type: 'dev',
          manager: 'npm'
        });
      }
    }
    
    // Peer dependencies
    if (pkg.peerDependencies) {
      for (const [name, version] of Object.entries(pkg.peerDependencies)) {
        dependencies.push({
          name,
          version: version as string,
          type: 'peer',
          manager: 'npm'
        });
      }
    }
    
    // Check for lockfile
    const dir = path.dirname(filePath);
    const hasLockfile = fs.existsSync(path.join(dir, 'package-lock.json')) ||
                       fs.existsSync(path.join(dir, 'yarn.lock')) ||
                       fs.existsSync(path.join(dir, 'pnpm-lock.yaml'));
    
    return {
      file: filePath,
      manager: 'npm',
      dependencies,
      hasLockfile
    };
  } catch {
    return null;
  }
}

/**
 * Scan for requirements.txt (Python pip)
 */
export function scanPipDependencies(filePath: string): DependencyScanResult | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const dependencies: Dependency[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
        continue;
      }
      
      // Parse package==version or package>=version, etc.
      const match = trimmed.match(/^([a-zA-Z0-9_-]+(?:\[[^\]]+\])?)([=<>!]+)?([\d.]+)?/);
      if (match) {
        dependencies.push({
          name: match[1],
          version: match[3] || '*',
          type: 'direct',
          manager: 'pip'
        });
      }
    }
    
    // Check for lockfile
    const dir = path.dirname(filePath);
    const hasLockfile = fs.existsSync(path.join(dir, 'requirements.lock')) ||
                       fs.existsSync(path.join(dir, 'Pipfile.lock'));
    
    return {
      file: filePath,
      manager: 'pip',
      dependencies,
      hasLockfile
    };
  } catch {
    return null;
  }
}

/**
 * Scan directory for dependency files
 */
export function scanDependencies(directory: string): DependencyScanResult[] {
  const results: DependencyScanResult[] = [];
  
  // Look for package.json
  const packageJson = path.join(directory, 'package.json');
  if (fs.existsSync(packageJson)) {
    const result = scanNpmDependencies(packageJson);
    if (result) results.push(result);
  }
  
  // Look for requirements.txt
  const requirementsTxt = path.join(directory, 'requirements.txt');
  if (fs.existsSync(requirementsTxt)) {
    const result = scanPipDependencies(requirementsTxt);
    if (result) results.push(result);
  }
  
  // Recursively search (limited depth)
  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && 
          !entry.name.startsWith('.') && 
          entry.name !== 'node_modules') {
        const subResults = scanDependencies(path.join(directory, entry.name));
        results.push(...subResults);
      }
    }
  } catch {
    // Ignore errors
  }
  
  return results;
}

