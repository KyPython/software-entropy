import { Rule } from '../types';
import { LongFunctionRule } from './LongFunctionRule';
import { LargeFileRule } from './LargeFileRule';
import { TodoFIXMERule } from './TodoFIXMERule';
import { HardcodedSecretRule } from './security/HardcodedSecretRule';
import { SQLInjectionRule } from './security/SQLInjectionRule';
import { XSSRule } from './security/XSSRule';
import { CSRFRule } from './security/CSRFRule';
import { AuthenticationFlawRule } from './security/AuthenticationFlawRule';
import { PathTraversalRule } from './security/PathTraversalRule';
import { CommandInjectionRule } from './security/CommandInjectionRule';
import { DuplicateCodeRule } from './quality/DuplicateCodeRule';
import { CyclomaticComplexityRule } from './quality/CyclomaticComplexityRule';
import { MagicNumberRule } from './quality/MagicNumberRule';
import { DeadCodeRule } from './quality/DeadCodeRule';
import { NestedConditionalRule } from './quality/NestedConditionalRule';
import { CognitiveComplexityRule } from './quality/CognitiveComplexityRule';
import { LongParameterListRule } from './quality/LongParameterListRule';

export { BaseRule } from './Rule';
export { LongFunctionRule } from './LongFunctionRule';
export { LargeFileRule } from './LargeFileRule';
export { TodoFIXMERule } from './TodoFIXMERule';
export * from './security';
export * from './quality';

export function createDefaultRules(): Rule[] {
  return [
    // Code Quality Rules
    new LongFunctionRule(50),
    new LargeFileRule(500),
    new TodoFIXMERule(5),
    new DuplicateCodeRule(5, 0.8),
    new CyclomaticComplexityRule(10),
    new MagicNumberRule(),
    new DeadCodeRule(),
    new NestedConditionalRule(3),
    new CognitiveComplexityRule(15),
    new LongParameterListRule(5),
    
    // Security Rules
    new HardcodedSecretRule(),
    new SQLInjectionRule(),
    new XSSRule(),
    new CSRFRule(),
    new AuthenticationFlawRule(),
    new PathTraversalRule(),
    new CommandInjectionRule()
  ];
}

