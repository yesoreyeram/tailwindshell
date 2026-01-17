/**
 * ShellPipeline - Sequential command execution with output passing
 */

import { useState, useEffect, useRef } from 'react';
import { Shell } from '../Shell';
import type {
  ShellPipelineProps,
  WorkflowResult,
  WorkflowContext,
} from '../types/workflow';
import type { CommandResult } from '../types';

/**
 * ShellPipeline component for sequential command execution
 *
 * Executes commands one after another, passing the stdout of each command
 * as stdin to the next command (like Unix pipes).
 *
 * @example
 * ```tsx
 * <ShellPipeline
 *   steps={[
 *     'cat-file.txt',
 *     'grep-error',
 *     'wc--l'
 *   ]}
 *   onComplete={(results) => console.log(results)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ShellPipeline
 *   steps={[
 *     { name: 'read', className: 'cat-data.txt' },
 *     { name: 'filter', className: 'grep-important' },
 *     { name: 'count', className: 'wc--l' }
 *   ]}
 *   onStepComplete={(result, context) => {
 *     console.log(`Step ${result.stepName} completed`);
 *   }}
 * />
 * ```
 */
export function ShellPipeline(props: ShellPipelineProps): JSX.Element | null {
  const {
    steps,
    onStepComplete,
    onComplete,
    onError,
    stopOnError = true,
    verbose = false,
    dryRun = false,
  } = props;

  const [context, setContext] = useState<WorkflowContext>({
    results: [],
    currentStep: 0,
    status: 'idle',
    startTime: undefined,
    endTime: undefined,
  });

  const executedRef = useRef(false);
  const [currentStdin, setCurrentStdin] = useState<string | undefined>(undefined);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current || context.status !== 'idle') {
      return;
    }

    executedRef.current = true;

    const startWorkflow = async () => {
      if (verbose) {
        console.log('[ShellPipeline] Starting pipeline with', steps.length, 'steps');
      }

      setContext((prev) => ({
        ...prev,
        status: 'running',
        startTime: Date.now(),
      }));
    };

    startWorkflow();
  }, [steps.length, verbose]);

  // Execute current step
  useEffect(() => {
    if (context.status !== 'running' || isExecuting) {
      return;
    }

    if (context.currentStep >= steps.length) {
      // All steps completed
      setContext((prev) => ({
        ...prev,
        status: 'completed',
        endTime: Date.now(),
      }));

      if (onComplete) {
        onComplete(context.results, context);
      }

      if (verbose) {
        console.log('[ShellPipeline] Pipeline completed successfully');
      }

      return;
    }

    const step = steps[context.currentStep];
    const stepConfig = typeof step === 'string' ? { name: `step-${context.currentStep}`, className: step } : step;

    setIsExecuting(true);

    if (verbose) {
      console.log(`[ShellPipeline] Executing step ${context.currentStep + 1}/${steps.length}: ${stepConfig.name}`);
    }
  }, [context.status, context.currentStep, isExecuting, steps, onComplete, verbose]);

  const handleStepComplete = (result: CommandResult) => {
    const step = steps[context.currentStep];
    const stepConfig = typeof step === 'string' ? { name: `step-${context.currentStep}`, className: step } : step;

    const workflowResult: WorkflowResult = {
      ...result,
      stepName: stepConfig.name,
      stepIndex: context.currentStep,
      timestamp: Date.now(),
    };

    if (verbose) {
      console.log(`[ShellPipeline] Step ${stepConfig.name} completed with exit code ${result.exitCode}`);
    }

    setContext((prev) => ({
      ...prev,
      results: [...prev.results, workflowResult],
      currentStep: prev.currentStep + 1,
    }));

    // Pass stdout as stdin to next command
    setCurrentStdin(result.stdout);
    setIsExecuting(false);

    if (onStepComplete) {
      onStepComplete(workflowResult, {
        ...context,
        results: [...context.results, workflowResult],
      });
    }

    // Call step-specific onComplete if provided
    if (stepConfig.onComplete) {
      stepConfig.onComplete(result);
    }
  };

  const handleStepError = (error: Error) => {
    const step = steps[context.currentStep];
    const stepConfig = typeof step === 'string' ? { name: `step-${context.currentStep}`, className: step } : step;

    if (verbose) {
      console.error(`[ShellPipeline] Step ${stepConfig.name} failed:`, error.message);
    }

    setContext((prev) => ({
      ...prev,
      status: stopOnError ? 'failed' : 'running',
      error,
      endTime: Date.now(),
    }));

    setIsExecuting(false);

    if (onError) {
      onError(error, context);
    }

    // Call step-specific onError if provided
    if (stepConfig.onError) {
      stepConfig.onError(error);
    }

    // Continue to next step if not stopping on error
    if (!stopOnError) {
      setContext((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  // Render current step
  if (context.status !== 'running' || context.currentStep >= steps.length) {
    return null;
  }

  const currentStepConfig = steps[context.currentStep];
  const stepConfig =
    typeof currentStepConfig === 'string'
      ? { name: `step-${context.currentStep}`, className: currentStepConfig }
      : currentStepConfig;

  // Check condition if provided
  if (stepConfig.condition && !stepConfig.condition(context.results)) {
    // Skip this step
    if (verbose) {
      console.log(`[ShellPipeline] Skipping step ${stepConfig.name} (condition not met)`);
    }

    setContext((prev) => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));

    setIsExecuting(false);
    return null;
  }

  // Transform input if transformer provided
  let effectiveStdin = currentStdin;
  if (stepConfig.transform && currentStdin !== undefined) {
    effectiveStdin = stepConfig.transform(currentStdin, context.results);
  }

  return (
    <Shell
      className={stepConfig.className}
      sudo={stepConfig.sudo}
      cwd={stepConfig.cwd}
      env={stepConfig.env}
      stdin={effectiveStdin}
      timeout={stepConfig.timeout}
      securityPolicy={stepConfig.securityPolicy}
      dryRun={dryRun}
      verbose={verbose}
      onComplete={handleStepComplete}
      onError={handleStepError}
    />
  );
}

export default ShellPipeline;
