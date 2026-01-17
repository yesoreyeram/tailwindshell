/**
 * Security validation for command execution
 */

import { ParsedCommand, SecurityPolicy, ValidationResult } from '../types';
import { isCommandAllowed, isPathAllowed, validateCommandString } from '../utils';

/**
 * Default security policy - restrictive by default
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowedCommands: [],
  blockedCommands: [
    'rm',
    'dd',
    'mkfs',
    'fdisk',
    'passwd',
    'shutdown',
    'reboot',
    'halt',
    'init',
    'telinit',
  ],
  allowedPaths: [],
  blockedPaths: ['/etc', '/sys', '/proc', '/dev', '/boot'],
  requireSudo: false,
  maxExecutionTime: 30000, // 30 seconds
  allowPiping: true,
  allowRedirection: false,
};

/**
 * Validate command against security policy
 */
export function validateSecurity(
  parsed: ParsedCommand,
  policy: SecurityPolicy = DEFAULT_SECURITY_POLICY
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate command is allowed
  if (!isCommandAllowed(parsed.command, policy.allowedCommands, policy.blockedCommands)) {
    errors.push(`Command '${parsed.command}' is not allowed by security policy`);
  }

  // Validate paths in arguments
  for (const arg of parsed.args) {
    if (arg.startsWith('/') || arg.startsWith('.')) {
      if (!isPathAllowed(arg, policy.allowedPaths, policy.blockedPaths)) {
        errors.push(`Path '${arg}' is not allowed by security policy`);
      }
    }
  }

  // Check for piping
  if (parsed.operator === 'pipe' && !policy.allowPiping) {
    errors.push('Command piping is not allowed by security policy');
  }

  // Check for redirection in arguments
  if (!policy.allowRedirection) {
    const redirectionPatterns = ['>', '<', '>>', '2>', '&>'];
    for (const arg of parsed.args) {
      if (redirectionPatterns.some((pattern) => arg.includes(pattern))) {
        errors.push('Command redirection is not allowed by security policy');
      }
    }
  }

  // Validate command string
  const fullCommand = buildFullCommand(parsed);
  const cmdValidation = validateCommandString(fullCommand);
  if (!cmdValidation.valid && cmdValidation.error) {
    errors.push(cmdValidation.error);
  }

  // Warn about sudo
  if (policy.requireSudo) {
    warnings.push('This command requires sudo privileges');
  }

  // Recursively validate chained commands
  if (parsed.nextCommand) {
    const nextValidation = validateSecurity(parsed.nextCommand, policy);
    errors.push(...nextValidation.errors);
    warnings.push(...nextValidation.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Build full command string from parsed command
 */
function buildFullCommand(parsed: ParsedCommand): string {
  const parts: string[] = [parsed.command];

  // Add flags
  for (const [key, value] of Object.entries(parsed.flags)) {
    if (value === true) {
      parts.push(key.length === 1 ? `-${key}` : `--${key}`);
    } else {
      parts.push(key.length === 1 ? `-${key} ${value}` : `--${key} ${value}`);
    }
  }

  // Add arguments
  parts.push(...parsed.args);

  let command = parts.join(' ');

  // Handle chained commands
  if (parsed.operator && parsed.nextCommand) {
    const operatorMap = {
      pipe: '|',
      and: '&&',
      or: '||',
      semicolon: ';',
      background: '&',
    };
    const nextCommand = buildFullCommand(parsed.nextCommand);
    command = `${command} ${operatorMap[parsed.operator]} ${nextCommand}`;
  }

  return command;
}

/**
 * Sanitize command for safe execution
 */
export function sanitizeCommand(command: string): string {
  // Remove null bytes
  let sanitized = command.replace(/\0/g, '');

  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
}

/**
 * Check if command requires elevated privileges
 */
export function requiresElevatedPrivileges(parsed: ParsedCommand): boolean {
  const privilegedCommands = [
    'apt',
    'apt-get',
    'yum',
    'dnf',
    'systemctl',
    'service',
    'mount',
    'umount',
    'chown',
    'chmod',
    'iptables',
  ];

  if (privilegedCommands.includes(parsed.command)) {
    return true;
  }

  // Check if any path is in privileged location
  const privilegedPaths = ['/etc/', '/sys/', '/proc/', '/boot/', '/usr/'];
  for (const arg of parsed.args) {
    if (privilegedPaths.some((path) => arg.startsWith(path))) {
      return true;
    }
  }

  // Recursively check chained commands
  if (parsed.nextCommand) {
    return requiresElevatedPrivileges(parsed.nextCommand);
  }

  return false;
}

/**
 * Rate limiting for command execution
 */
export class RateLimiter {
  private executions: Map<string, number[]> = new Map();
  private readonly maxExecutions: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxExecutions: number = 10, timeWindow: number = 60000) {
    this.maxExecutions = maxExecutions;
    this.timeWindow = timeWindow;
  }

  /**
   * Check if execution is allowed
   */
  isAllowed(command: string): boolean {
    const now = Date.now();
    const executions = this.executions.get(command) || [];

    // Remove old executions outside time window
    const recentExecutions = executions.filter((time) => now - time < this.timeWindow);

    if (recentExecutions.length >= this.maxExecutions) {
      return false;
    }

    // Add current execution
    recentExecutions.push(now);
    this.executions.set(command, recentExecutions);

    return true;
  }

  /**
   * Reset rate limit for a command
   */
  reset(command?: string): void {
    if (command) {
      this.executions.delete(command);
    } else {
      this.executions.clear();
    }
  }
}
