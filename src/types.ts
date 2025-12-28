export interface CodeSmell {
  rule: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  file: string;
  line?: number;
  column?: number;
  metadata?: Record<string, any>;
}

export interface ScanResult {
  file: string;
  smells: CodeSmell[];
  stats: {
    lines: number;
    functions: number;
    classes: number;
  };
}

export interface ScanReport {
  scannedAt: string;
  totalFiles: number;
  totalSmells: number;
  results: ScanResult[];
  summary: {
    byRule: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

export interface RuleContext {
  file: string;
  content: string;
  lines: string[];
  ast?: any; // ASTNode from parsers/ast.ts
  language?: 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'unknown';
}

export interface Rule {
  name: string;
  description: string;
  enabled: boolean;
  run(context: RuleContext): CodeSmell[];
}

