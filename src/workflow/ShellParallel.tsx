/**
 * ShellParallel - Execute multiple commands in parallel
 */

import { useState, useEffect, useRef } from 'react';
import { Shell } from '../Shell';
import type { ShellParallelProps, WorkflowStep, WorkflowResult } from '../types/workflow';
import type { CommandResult } from '../types';

/**
 * ShellParallel component for parallel command execution
 *
 * Executes multiple commands simultaneously without waiting for each to complete.
 * Useful for running independent tasks that don't depend on each other.
 *
 * @example
 * ```tsx
 * <ShellParallel
 *   commands={[
 *     'npm-run-build',
 *     'npm-run-test',
 *     'npm-run-lint'
 *   ]}
 *   onComplete={(results) => {
 *     console.log('All commands completed', results);
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ShellParallel
 *   commands={[
 *     { name: 'build', className: 'npm-run-build' },
 *     { name: 'test', className: 'npm-run-test' },
 *     { name: 'lint', className: 'npm-run-lint' }
 *   ]}
 *   onComplete={(results) => {
 *     const allPassed = results.every(r => r.exitCode === 0);
 *     console.log(allPassed ? 'Success!' : 'Some failed');
 *   }}
 * />
 * ```
 */
export function ShellParallel(props: ShellParallelProps): JSX.Element | null {
  const { commands, onComplete, onError, verbose = false, dryRun = false } = props;

  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const executedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current) {
      return;
    }
    executedRef.current = true;

    if (verbose) {
      console.log('[ShellParallel] Starting parallel execution of', commands.length, 'commands');
    }

    startTimeRef.current = Date.now();
  }, [commands.length, verbose]);

  useEffect(() => {
    if (completedCount === commands.length && completedCount > 0) {
      const duration = Date.now() - startTimeRef.current;

      if (verbose) {
        console.log(`[ShellParallel] All commands completed in ${duration}ms`);
      }

      if (errors.length > 0 && onError) {
        onError(errors);
      }

      if (onComplete) {
        onComplete(results);
      }
    }
  }, [completedCount, commands.length, results, errors, onComplete, onError, verbose]);

  const createHandlers = (index: number) => {
    const command = commands[index];
    const commandConfig =
      typeof command === 'string' ? { name: `command-${index}`, className: command } : command;

    const handleComplete = (result: CommandResult) => {
      const workflowResult: WorkflowResult = {
        ...result,
        stepName: commandConfig.name,
        stepIndex: index,
        timestamp: Date.now(),
      };

      if (verbose) {
        console.log(`[ShellParallel] Command "${commandConfig.name}" completed with exit code ${result.exitCode}`);
      }

      setResults((prev) => [...prev, workflowResult]);
      setCompletedCount((prev) => prev + 1);

      if (commandConfig.onComplete) {
        commandConfig.onComplete(result);
      }
    };

    const handleError = (error: Error) => {
      if (verbose) {
        console.error(`[ShellParallel] Command "${commandConfig.name}" failed:`, error.message);
      }

      setErrors((prev) => [...prev, error]);
      setCompletedCount((prev) => prev + 1);

      if (commandConfig.onError) {
        commandConfig.onError(error);
      }
    };

    return { handleComplete, handleError };
  };

  return (
    <>
      {commands.map((command, index) => {
        const commandConfig =
          typeof command === 'string' ? { name: `command-${index}`, className: command } : command;
        const handlers = createHandlers(index);

        return (
          <Shell
            key={`${commandConfig.name}-${index}`}
            className={commandConfig.className}
            sudo={commandConfig.sudo}
            cwd={commandConfig.cwd}
            env={commandConfig.env}
            timeout={commandConfig.timeout}
            securityPolicy={commandConfig.securityPolicy}
            dryRun={dryRun}
            verbose={verbose}
            onComplete={handlers.handleComplete}
            onError={handlers.handleError}
          />
        );
      })}
    </>
  );
}

export default ShellParallel;
