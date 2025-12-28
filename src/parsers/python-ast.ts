import * as fs from 'fs';
import { execSync } from 'child_process';

export interface PythonASTNode {
  type: string;
  lineno?: number;
  col_offset?: number;
  end_lineno?: number;
  end_col_offset?: number;
  [key: string]: any;
}

export interface ParsedPythonFile {
  file: string;
  ast: PythonASTNode | null;
  language: 'python';
  errors: string[];
}

/**
 * Parse Python file using Python's ast module
 * This requires Python to be installed on the system
 */
export function parsePython(filePath: string, content: string): ParsedPythonFile {
  const errors: string[] = [];
  
  try {
    // Create a temporary Python script to parse the AST
    const parseScript = `
import ast
import json
import sys

try:
    with open('${filePath.replace(/\\/g, '\\\\')}', 'r', encoding='utf-8') as f:
        code = f.read()
    
    tree = ast.parse(code, filename='${filePath.replace(/\\/g, '\\\\')}')
    
    def ast_to_dict(node):
        if isinstance(node, ast.AST):
            result = {'type': node.__class__.__name__}
            if hasattr(node, 'lineno'):
                result['lineno'] = node.lineno
            if hasattr(node, 'col_offset'):
                result['col_offset'] = node.col_offset
            if hasattr(node, 'end_lineno'):
                result['end_lineno'] = node.end_lineno
            if hasattr(node, 'end_col_offset'):
                result['end_col_offset'] = node.end_col_offset
            
            for field, value in ast.iter_fields(node):
                if isinstance(value, list):
                    result[field] = [ast_to_dict(item) for item in value]
                elif isinstance(value, ast.AST):
                    result[field] = ast_to_dict(value)
                else:
                    result[field] = value
            return result
        elif isinstance(node, list):
            return [ast_to_dict(item) for item in node]
        else:
            return node
    
    print(json.dumps(ast_to_dict(tree), indent=2))
except SyntaxError as e:
    print(json.dumps({'error': str(e), 'lineno': e.lineno, 'offset': e.offset}), file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(json.dumps({'error': str(e)}), file=sys.stderr)
    sys.exit(1)
`;

    // Write script to temp file
    const tempScript = '/tmp/parse_python_ast.py';
    fs.writeFileSync(tempScript, parseScript);
    
    // Also write the source file to a temp location if needed
    const tempSource = '/tmp/temp_python_source.py';
    fs.writeFileSync(tempSource, content);

    // Execute Python script
    try {
      const output = execSync(`python3 ${tempScript}`, {
        encoding: 'utf-8',
        timeout: 5000,
        cwd: process.cwd()
      });
      
      const ast = JSON.parse(output);
      
      // Clean up
      try {
        fs.unlinkSync(tempScript);
        fs.unlinkSync(tempSource);
      } catch {}

      return {
        file: filePath,
        ast,
        language: 'python',
        errors: []
      };
    } catch (execError: any) {
      const errorOutput = execError.stderr || execError.stdout || execError.message;
      errors.push(errorOutput);
      
      // Clean up
      try {
        fs.unlinkSync(tempScript);
        fs.unlinkSync(tempSource);
      } catch {}

      return {
        file: filePath,
        ast: null,
        language: 'python',
        errors
      };
    }
  } catch (error) {
    return {
      file: filePath,
      ast: null,
      language: 'python',
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Find all functions in Python AST
 */
export function findPythonFunctions(ast: PythonASTNode | null): Array<{ name: string; start: number; end: number }> {
  if (!ast) return [];

  const functions: Array<{ name: string; start: number; end: number }> = [];

  function traverse(node: PythonASTNode) {
    if (node.type === 'FunctionDef' || node.type === 'AsyncFunctionDef') {
      const name = node.name || 'anonymous';
      const start = node.lineno || 0;
      const end = node.end_lineno || start;
      
      functions.push({
        name,
        start,
        end
      });
    }

    // Traverse children
    for (const key in node) {
      if (key === 'type' || key === 'lineno' || key === 'col_offset' || 
          key === 'end_lineno' || key === 'end_col_offset' || key === 'name') {
        continue;
      }
      
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else if (value && typeof value === 'object') {
        traverse(value);
      }
    }
  }

  if (ast.body && Array.isArray(ast.body)) {
    ast.body.forEach(traverse);
  } else {
    traverse(ast);
  }

  return functions;
}

/**
 * Find all classes in Python AST
 */
export function findPythonClasses(ast: PythonASTNode | null): Array<{ name: string; start: number; end: number }> {
  if (!ast) return [];

  const classes: Array<{ name: string; start: number; end: number }> = [];

  function traverse(node: PythonASTNode) {
    if (node.type === 'ClassDef') {
      const name = node.name || 'anonymous';
      const start = node.lineno || 0;
      const end = node.end_lineno || start;
      
      classes.push({
        name,
        start,
        end
      });
    }

    // Traverse children
    for (const key in node) {
      if (key === 'type' || key === 'lineno' || key === 'col_offset' || 
          key === 'end_lineno' || key === 'end_col_offset' || key === 'name') {
        continue;
      }
      
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else if (value && typeof value === 'object') {
        traverse(value);
      }
    }
  }

  if (ast.body && Array.isArray(ast.body)) {
    ast.body.forEach(traverse);
  } else {
    traverse(ast);
  }

  return classes;
}

