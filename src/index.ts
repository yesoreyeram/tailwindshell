/**
 * Tailwindshell - Execute shell commands with Tailwind-style syntax
 *
 * @packageDocumentation
 */

// Export main component
export { Shell, ShellWithOutput } from './Shell';
export { default } from './Shell';

// Export types
export type {
  ShellProps,
  CommandResult,
  ParsedCommand,
  SecurityPolicy,
  ExecutionContext,
  ExecutionOptions,
  CommandOperator,
  ConditionalConfig,
  LoopConfig,
  ParserOptions,
  ValidationResult,
} from './types';

// Export parser
export { CommandParser, parse, toShellCommand } from './parser';
export { Tokenizer, tokensToCommand } from './parser/tokenizer';

// Export executor
export { CommandExecutor, execute } from './executor';
export { validateSecurity, DEFAULT_SECURITY_POLICY, RateLimiter } from './executor/security';

// Export utilities
export {
  escapeShellArg,
  isCommandAllowed,
  isPathAllowed,
  parseEnvVars,
  formatDuration,
  validateCommandString,
  sanitizeOutput,
  deepMerge,
} from './utils';

// Export features
export {
  parseConditional,
  conditionalToShell,
  executeConditional,
} from './features/conditionals';
export { parseLoop, loopToShell, executeForLoop, executeWhileLoop } from './features/loops';
export {
  VariableStore,
  parseVariableAssignment,
  globalVariables,
} from './features/variables';

// Export workflow components
export {
  ShellPipeline,
  ShellWorkflow,
  ShellParallel,
  ShellConditional,
  ShellLoop,
  IF,
  ElseIf,
  Else,
} from './workflow';
export type {
  WorkflowStep,
  WorkflowResult,
  WorkflowStatus,
  WorkflowContext,
  ShellPipelineProps,
  ShellWorkflowProps,
  ShellParallelProps,
  ShellConditionalProps,
  ShellLoopProps,
  IFProps,
  ElseIfProps,
  ElseProps,
  Condition,
} from './workflow';
