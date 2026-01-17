/**
 * Utility functions for Tailwindshell
 */

/**
 * Escape shell arguments to prevent injection
 */
export function escapeShellArg(arg: string): string {
  // Replace single quotes with '\'' and wrap in single quotes
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Check if a command is allowed by security policy
 */
export function isCommandAllowed(
  command: string,
  allowedCommands?: string[],
  blockedCommands?: string[]
): boolean {
  // Check blocked list first
  if (blockedCommands && blockedCommands.length > 0) {
    if (blockedCommands.includes(command)) {
      return false;
    }
  }

  // Check allowed list
  if (allowedCommands && allowedCommands.length > 0) {
    return allowedCommands.includes(command);
  }

  // Default allow if no restrictions
  return true;
}

/**
 * Check if a path is allowed by security policy
 */
export function isPathAllowed(
  path: string,
  allowedPaths?: string[],
  blockedPaths?: string[]
): boolean {
  // Check blocked paths
  if (blockedPaths && blockedPaths.length > 0) {
    for (const blocked of blockedPaths) {
      if (path.startsWith(blocked)) {
        return false;
      }
    }
  }

  // Check allowed paths
  if (allowedPaths && allowedPaths.length > 0) {
    for (const allowed of allowedPaths) {
      if (path.startsWith(allowed)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

/**
 * Parse environment variables from array format
 */
export function parseEnvVars(envArray: string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const item of envArray) {
    const [key, ...valueParts] = item.split('=');
    if (key) {
      env[key] = valueParts.join('=');
    }
  }
  return env;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
}

/**
 * Validate command string
 */
export function validateCommandString(cmd: string): { valid: boolean; error?: string } {
  if (!cmd || cmd.trim().length === 0) {
    return { valid: false, error: 'Command cannot be empty' };
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /;\s*rm\s+-rf\s+\/(?!\w)/i, // rm -rf /
    /:\(\)\{.*\|.*&\}/i, // Fork bomb
    />\s*\/dev\/sda/i, // Writing to disk device
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cmd)) {
      return { valid: false, error: 'Command contains dangerous pattern' };
    }
  }

  return { valid: true };
}

/**
 * Sanitize command output
 */
export function sanitizeOutput(output: string, maxLength: number = 10000): string {
  if (output.length > maxLength) {
    return output.substring(0, maxLength) + '\n... (output truncated)';
  }
  return output;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  return result;
}
