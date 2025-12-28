import * as ts from 'typescript';
import * as fs from 'fs';

export interface ASTNode {
  kind: string;
  text: string;
  start: number;
  end: number;
  children?: ASTNode[];
}

export interface ParsedFile {
  file: string;
  ast: ASTNode | null;
  language: 'typescript' | 'javascript' | 'unknown';
  errors: string[];
}

/**
 * Parse TypeScript/JavaScript file using TypeScript compiler API
 */
export function parseTypeScript(filePath: string, content: string): ParsedFile {
  const errors: string[] = [];
  
  try {
    // Create source file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Check for parse errors
    const diagnostics = ts.getPreEmitDiagnostics(
      ts.createProgram([filePath], {
        noEmit: true,
        skipLibCheck: true
      })
    );

    diagnostics.forEach(diagnostic => {
      if (diagnostic.category === ts.DiagnosticCategory.Error) {
        errors.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      }
    });

    // Convert to our AST format
    const ast = convertNode(sourceFile);

    return {
      file: filePath,
      ast,
      language: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
      errors
    };
  } catch (error) {
    return {
      file: filePath,
      ast: null,
      language: 'unknown',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

function convertNode(node: ts.Node): ASTNode {
  const children: ASTNode[] = [];
  
  ts.forEachChild(node, child => {
    children.push(convertNode(child));
  });

  return {
    kind: ts.SyntaxKind[node.kind],
    text: node.getText(),
    start: node.getStart(),
    end: node.getEnd(),
    children: children.length > 0 ? children : undefined
  };
}

/**
 * Find all functions in AST
 */
export function findFunctions(ast: ASTNode | null): Array<{ name: string; start: number; end: number }> {
  if (!ast) return [];

  const functions: Array<{ name: string; start: number; end: number }> = [];

  function traverse(node: ASTNode) {
    if (node.kind === 'FunctionDeclaration' || 
        node.kind === 'MethodDeclaration' ||
        node.kind === 'ArrowFunction') {
      // Try to extract function name
      const nameMatch = node.text.match(/(?:function\s+)?(\w+)\s*\(/);
      const name = nameMatch ? nameMatch[1] : 'anonymous';
      
      functions.push({
        name,
        start: node.start,
        end: node.end
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(ast);
  return functions;
}

/**
 * Find all classes in AST
 */
export function findClasses(ast: ASTNode | null): Array<{ name: string; start: number; end: number }> {
  if (!ast) return [];

  const classes: Array<{ name: string; start: number; end: number }> = [];

  function traverse(node: ASTNode) {
    if (node.kind === 'ClassDeclaration') {
      const nameMatch = node.text.match(/class\s+(\w+)/);
      const name = nameMatch ? nameMatch[1] : 'anonymous';
      
      classes.push({
        name,
        start: node.start,
        end: node.end
      });
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(ast);
  return classes;
}

