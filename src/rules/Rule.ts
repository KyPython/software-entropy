import { Rule, RuleContext, CodeSmell } from '../types';

export abstract class BaseRule implements Rule {
  abstract name: string;
  abstract description: string;
  enabled: boolean = true;

  abstract run(context: RuleContext): CodeSmell[];

  protected createSmell(
    message: string,
    file: string,
    severity: 'low' | 'medium' | 'high' = 'medium',
    line?: number,
    column?: number,
    metadata?: Record<string, any>
  ): CodeSmell {
    return {
      rule: this.name,
      severity,
      message,
      file,
      line,
      column,
      metadata
    };
  }
}

