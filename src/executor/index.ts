/**
 * Command executor with security controls
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import {
  ParsedCommand,
  CommandResult,
  ExecutionContext,
  ExecutionOptions,
  SecurityPolicy,
} from '../types';
import { validateSecurity, sanitizeCommand, DEFAULT_SECURITY_POLICY } from './security';
import { toShellCommand } from '../parser';

const execAsync = promisify(exec);

export class CommandExecutor {
  private context: ExecutionContext;

  constructor(context: Partial<ExecutionContext> = {}) {
    this.context = {
      cwd: context.cwd || process.cwd(),
      env: { ...process.env, ...context.env },
      sudo: context.sudo || false,
      securityPolicy: { ...DEFAULT_SECURITY_POLICY, ...context.securityPolicy },
      timeout: context.timeout || 30000,
      verbose: context.verbose || false,
    };
  }

  /**
   * Execute a parsed command
   */
  async execute(
    parsed: ParsedCommand,
    options: ExecutionOptions = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();

    // Validate security
    const validation = validateSecurity(parsed, this.context.securityPolicy);
    if (!validation.valid) {
      throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert to shell command
    const shellCommand = toShellCommand(parsed);
    const sanitized = sanitizeCommand(shellCommand);

    if (this.context.verbose) {
      console.log(`[Tailwindshell] Executing: ${sanitized}`);
      if (validation.warnings.length > 0) {
        console.warn(`[Tailwindshell] Warnings: ${validation.warnings.join(', ')}`);
      }
    }

    // Dry run mode
    if (options.dryRun) {
      return {
        stdout: `[DRY RUN] Would execute: ${sanitized}`,
        stderr: '',
        exitCode: 0,
        command: sanitized,
        duration: Date.now() - startTime,
      };
    }

    // Prepend sudo if required
    const finalCommand = this.context.sudo ? `sudo ${sanitized}` : sanitized;

    try {
      const result = await this.executeCommand(finalCommand, options);
      return {
        ...result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (this.context.verbose) {
        console.error(`[Tailwindshell] Execution failed:`, error);
      }
      throw error;
    }
  }

  /**
   * Execute shell command with timeout
   */
  private async executeCommand(
    command: string,
    options: ExecutionOptions
  ): Promise<Omit<CommandResult, 'duration'>> {
    const shell = options.shell || '/bin/bash';

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timeout after ${this.context.timeout}ms`));
      }, this.context.timeout);

      let stdout = '';
      let stderr = '';

      const child = spawn(shell, ['-c', command], {
        cwd: this.context.cwd,
        env: this.context.env as NodeJS.ProcessEnv,
        stdio: options.captureOutput !== false ? 'pipe' : 'inherit',
      });

      // Write stdin if provided
      if (options.stdin && child.stdin) {
        child.stdin.write(options.stdin);
        child.stdin.end();
      }

      if (options.captureOutput !== false) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          command,
        });
      });
    });
  }

  /**
   * Execute command and stream output
   */
  async executeStream(
    parsed: ParsedCommand,
    onData: (data: string, type: 'stdout' | 'stderr') => void
  ): Promise<CommandResult> {
    const startTime = Date.now();

    // Validate security
    const validation = validateSecurity(parsed, this.context.securityPolicy);
    if (!validation.valid) {
      throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
    }

    const shellCommand = toShellCommand(parsed);
    const sanitized = sanitizeCommand(shellCommand);
    const finalCommand = this.context.sudo ? `sudo ${sanitized}` : sanitized;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timeout after ${this.context.timeout}ms`));
      }, this.context.timeout);

      let stdout = '';
      let stderr = '';

      const child = spawn('/bin/bash', ['-c', finalCommand], {
        cwd: this.context.cwd,
        env: this.context.env as NodeJS.ProcessEnv,
      });

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        onData(text, 'stdout');
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        onData(text, 'stderr');
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          command: finalCommand,
          duration: Date.now() - startTime,
        });
      });
    });
  }

  /**
   * Update execution context
   */
  updateContext(updates: Partial<ExecutionContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get current context
   */
  getContext(): ExecutionContext {
    return { ...this.context };
  }
}

/**
 * Convenience function to execute a Tailwind-style command
 */
export async function execute(
  command: string,
  context?: Partial<ExecutionContext>,
  options?: ExecutionOptions
): Promise<CommandResult> {
  const { parse } = await import('../parser');
  const parsed = parse(command);
  const executor = new CommandExecutor(context);
  return executor.execute(parsed, options);
}

export { validateSecurity, DEFAULT_SECURITY_POLICY } from './security';
