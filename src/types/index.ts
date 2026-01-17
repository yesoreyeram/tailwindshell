/**
 * Core type definitions for Tailwindshell
 */

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  duration: number;
}

/**
 * Parsed command structure
 */
export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  operator?: CommandOperator;
  nextCommand?: ParsedCommand;
}

/**
 * Command operators for chaining
 */
export type CommandOperator = 'pipe' | 'and' | 'or' | 'semicolon' | 'background';

/**
 * Security policy configuration
 */
export interface SecurityPolicy {
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowedPaths?: string[];
  blockedPaths?: string[];
  requireSudo?: boolean;
  maxExecutionTime?: number;
  allowPiping?: boolean;
  allowRedirection?: boolean;
}

/**
 * Shell component props
 */
export interface ShellProps {
  /**
   * Command in Tailwind-style syntax (e.g., "ls--la-/home")
   */
  classNames: string;

  /**
   * Execute command with sudo privileges
   */
  sudo?: boolean;

  /**
   * Working directory for command execution
   */
  cwd?: string;

  /**
   * Environment variables
   */
  env?: Record<string, string>;

  /**
   * Standard input to pipe into the command
   */
  stdin?: string;

  /**
   * Callback when command completes
   */
  onComplete?: (result: CommandResult) => void;

  /**
   * Callback when command fails
   */
  onError?: (error: Error) => void;

  /**
   * Security policy to apply
   */
  securityPolicy?: SecurityPolicy;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Dry run mode (parse without executing)
   */
  dryRun?: boolean;

  /**
   * Verbose logging
   */
  verbose?: boolean;
}

/**
 * Conditional execution config
 */
export interface ConditionalConfig {
  condition: string;
  trueCommand: string;
  falseCommand?: string;
}

/**
 * Loop execution config
 */
export interface LoopConfig {
  type: 'for' | 'while';
  iterator: string;
  items?: string[];
  condition?: string;
  command: string;
}

/**
 * Execution context
 */
export interface ExecutionContext {
  cwd: string;
  env: Record<string, string>;
  sudo: boolean;
  securityPolicy: SecurityPolicy;
  timeout: number;
  verbose: boolean;
}

/**
 * Parser options
 */
export interface ParserOptions {
  allowConditionals?: boolean;
  allowLoops?: boolean;
  allowVariables?: boolean;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  dryRun?: boolean;
  captureOutput?: boolean;
  shell?: string;
  stdin?: string;
}

/**
 * Command validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
