import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CacheEntry {
  file: string;
  hash: string;
  ast: any;
  timestamp: number;
}

export class ASTCache {
  private cacheDir: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(cacheDir: string = '.software-entropy-cache') {
    this.cacheDir = cacheDir;
    this.loadCache();
  }

  private getCacheFilePath(filePath: string): string {
    const hash = crypto.createHash('md5').update(filePath).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  private getFileHash(filePath: string, content: string): string {
    const stats = fs.statSync(filePath);
    return crypto
      .createHash('md5')
      .update(content)
      .update(stats.mtime.getTime().toString())
      .update(stats.size.toString())
      .digest('hex');
  }

  get(filePath: string, content: string): any | null {
    const currentHash = this.getFileHash(filePath, content);
    const cached = this.cache.get(filePath);

    if (cached && cached.hash === currentHash) {
      return cached.ast;
    }

    return null;
  }

  set(filePath: string, content: string, ast: any): void {
    const hash = this.getFileHash(filePath, content);
    
    this.cache.set(filePath, {
      file: filePath,
      hash,
      ast,
      timestamp: Date.now()
    });

    // Persist to disk
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      
      const cacheFile = this.getCacheFilePath(filePath);
      fs.writeFileSync(cacheFile, JSON.stringify({
        file: filePath,
        hash,
        ast,
        timestamp: Date.now()
      }), 'utf-8');
    } catch (error) {
      // Fail silently - caching is optional
    }
  }

  private loadCache(): void {
    if (!fs.existsSync(this.cacheDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const cacheFile = path.join(this.cacheDir, file);
          const entry: CacheEntry = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
          this.cache.set(entry.file, entry);
        }
      }
    } catch (error) {
      // Fail silently
    }
  }

  clear(): void {
    this.cache.clear();
    if (fs.existsSync(this.cacheDir)) {
      try {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
      } catch (error) {
        // Fail silently
      }
    }
  }
}

