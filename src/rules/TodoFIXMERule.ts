import { BaseRule } from './Rule';
import { RuleContext, CodeSmell } from '../types';

export class TodoFIXMERule extends BaseRule {
  name = 'todo-fixme-density';
  description = 'Detects high density of TODO/FIXME comments';
  
  private maxDensity: number; // max per 100 lines

  constructor(maxDensity: number = 5) {
    super();
    this.maxDensity = maxDensity;
  }

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = context.lines;
    
    const todoPattern = /TODO|FIXME|XXX|HACK|NOTE/i;
    const todos: Array<{ line: number; text: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      if (todoPattern.test(lines[i])) {
        const match = lines[i].match(/TODO|FIXME|XXX|HACK|NOTE/i);
        todos.push({
          line: i + 1,
          text: lines[i].trim()
        });
      }
    }

    if (todos.length > 0) {
      const density = (todos.length / lines.length) * 100;
      
      if (density > this.maxDensity) {
        smells.push(
          this.createSmell(
            `High TODO/FIXME density: ${todos.length} found in ${lines.length} lines (${density.toFixed(2)}% density, threshold: ${this.maxDensity}%)`,
            context.file,
            density > this.maxDensity * 2 ? 'high' : 'medium',
            undefined,
            undefined,
            { 
              count: todos.length, 
              density: parseFloat(density.toFixed(2)), 
              threshold: this.maxDensity,
              todos: todos.map(t => ({ line: t.line, text: t.text.substring(0, 50) }))
            }
          )
        );
      }
    }

    return smells;
  }
}

