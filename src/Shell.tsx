/**
 * Shell Component for executing commands with Tailwind-style syntax
 */

import { useEffect, useState, useRef } from 'react';
import type { ShellProps, CommandResult } from './types';
import { parse } from './parser';
import { CommandExecutor } from './executor';
import { DEFAULT_SECURITY_POLICY } from './executor/security';

/**
 * Shell component for server-side command execution
 *
 * @example
 * ```tsx
 * <Shell classNames="ls--la-/home" />
 * <Shell classNames="cat-file.txt_pipe_grep-error" />
 * <Shell classNames="echo-hello" sudo={true} />
 * ```
 */
export function Shell(props: ShellProps): JSX.Element | null {
  const {
    classNames,
    sudo = false,
    cwd,
    env,
    stdin,
    onComplete,
    onError,
    securityPolicy,
    timeout = 30000,
    dryRun = false,
    verbose = false,
  } = props;

  const [result, setResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const executedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current) {
      return;
    }
    executedRef.current = true;

    const executeCommand = async () => {
      setIsExecuting(true);
      setError(null);

      try {
        // Parse command
        const parsed = parse(classNames);

        // Create executor
        const executor = new CommandExecutor({
          cwd: cwd || process.cwd(),
          env: env || {},
          sudo,
          securityPolicy: { ...DEFAULT_SECURITY_POLICY, ...securityPolicy },
          timeout,
          verbose,
        });

        // Execute command
        const commandResult = await executor.execute(parsed, { dryRun, stdin });

        setResult(commandResult);

        // Call completion callback
        if (onComplete) {
          onComplete(commandResult);
        }

        // Log result in verbose mode
        if (verbose) {
          console.log('[Tailwindshell] Command completed:', {
            command: commandResult.command,
            exitCode: commandResult.exitCode,
            duration: commandResult.duration,
          });
        }
      } catch (err) {
        const execError = err instanceof Error ? err : new Error(String(err));
        setError(execError);

        // Call error callback
        if (onError) {
          onError(execError);
        }

        // Log error in verbose mode
        if (verbose) {
          console.error('[Tailwindshell] Command failed:', execError);
        }
      } finally {
        setIsExecuting(false);
      }
    };

    executeCommand();
  }, [classNames, sudo, cwd, env, stdin, timeout, dryRun, verbose, onComplete, onError, securityPolicy]);

  // This component doesn't render anything by default
  // It's primarily for side effects (command execution)
  return null;
}

/**
 * Shell component with output rendering
 */
export function ShellWithOutput(
  props: ShellProps & { renderOutput?: (result: CommandResult) => JSX.Element }
): JSX.Element {
  const [result, setResult] = useState<CommandResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleComplete = (commandResult: CommandResult) => {
    setResult(commandResult);
    if (props.onComplete) {
      props.onComplete(commandResult);
    }
  };

  const handleError = (err: Error) => {
    setError(err);
    if (props.onError) {
      props.onError(err);
    }
  };

  return (
    <>
      <Shell {...props} onComplete={handleComplete} onError={handleError} />
      {error && (
        <div style={{ color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          Error: {error.message}
        </div>
      )}
      {result && !error && (
        <>
          {props.renderOutput ? (
            props.renderOutput(result)
          ) : (
            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {result.stdout}
              {result.stderr && (
                <div style={{ color: 'red' }}>{result.stderr}</div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default Shell;
