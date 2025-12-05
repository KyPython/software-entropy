import { Rule } from '../types';
import { LongFunctionRule } from './LongFunctionRule';
import { LargeFileRule } from './LargeFileRule';
import { TodoFIXMERule } from './TodoFIXMERule';

export { BaseRule } from './Rule';
export { LongFunctionRule } from './LongFunctionRule';
export { LargeFileRule } from './LargeFileRule';
export { TodoFIXMERule } from './TodoFIXMERule';

export function createDefaultRules(): Rule[] {
  return [
    new LongFunctionRule(50),
    new LargeFileRule(500),
    new TodoFIXMERule(5)
  ];
}

