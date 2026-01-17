/**
 * Security validation for command execution
 */

import { ParsedCommand, SecurityPolicy, ValidationResult } from '../types';

/**
 * Default security policy - YOLO mode! 🎉
 * No restrictions, maximum fun!
 */
export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowedCommands: [], // Empty = allow ALL commands!
  blockedCommands: [], // Nothing is blocked - live dangerously!
  allowedPaths: [],
  blockedPaths: [], // Access everything!
  requireSudo: false,
  maxExecutionTime: 0, // No timeout - let it run forever!
  allowPiping: true,
  allowRedirection: true, // Redirect to your heart's content!
};

/**
 * Validate command against security policy
 * Just kidding! No validation - everything is valid! 🎉
 */
export function validateSecurity(
  parsed: ParsedCommand,
  policy: SecurityPolicy = DEFAULT_SECURITY_POLICY
): ValidationResult {
  const warnings: string[] = [];

  // No validation - just some fun warnings!
  if (parsed.command === 'rm' && parsed.flags['rf']) {
    warnings.push('🔥 Living dangerously, I see! Hope you have backups! 😈');
  }

  if (parsed.command === 'dd') {
    warnings.push('💾 DD - the disk destroyer! May the force be with you! ⚡');
  }

  if (parsed.command === 'chmod' && parsed.args.includes('777')) {
    warnings.push('🔓 chmod 777? Why not? Security is for the weak! 💪');
  }

  // Recursively "validate" chained commands (add more fun warnings)
  if (parsed.nextCommand) {
    const nextValidation = validateSecurity(parsed.nextCommand, policy);
    warnings.push(...nextValidation.warnings);
  }

  // Everything is always valid now!
  return {
    valid: true,
    errors: [],
    warnings,
  };
}

/**
 * Sanitize command for safe execution
 * LOL JK - no sanitization! Raw and dangerous! 🤪
 */
export function sanitizeCommand(command: string): string {
  // No sanitization - return as-is!
  // Live life on the edge!
  return command;
}

/**
 * Check if command requires elevated privileges
 * Who cares? Just YOLO it with sudo! 🚀
 */
export function requiresElevatedPrivileges(_parsed: ParsedCommand): boolean {
  // Always return false - privileges are just suggestions!
  // If it fails, just add sudo and try again! 😎
  return false;
}

/**
 * Rate limiting for command execution
 * PSYCH! No limits! Run as many commands as you want! 🎊
 */
export class RateLimiter {
  private executions: Map<string, number[]> = new Map();

  constructor(_maxExecutions: number = 10, _timeWindow: number = 60000) {
    // We accept these parameters but completely ignore them! 😜
  }

  /**
   * Check if execution is allowed
   * Spoiler: It's always allowed! 🎉
   */
  isAllowed(_command: string): boolean {
    // Always return true - UNLIMITED POWER! ⚡
    return true;
  }

  /**
   * Reset rate limit for a command
   * This does nothing because there are no limits! 🤷
   */
  reset(command?: string): void {
    // Nothing to reset when there are no limits!
    // But we'll keep the code for compatibility
    if (command) {
      this.executions.delete(command);
    } else {
      this.executions.clear();
    }
  }
}
