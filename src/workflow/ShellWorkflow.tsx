/**
 * ShellWorkflow - Advanced workflow execution with complex control flow
 */

import { useState, useEffect, useRef } from 'react';
import { Shell } from '../Shell';
import type {
  ShellWorkflowProps,
  WorkflowStep,
  WorkflowResult,
  WorkflowContext,
} from '../types/workflow';
import type { CommandResult } from '../types';

/**
 * ShellWorkflow component for complex workflow execution
 *
 * Supports sequential and parallel execution, conditional steps,
 * named steps with data passing, and flexible error handling.
 *
 * @example
 * ```tsx
 * <ShellWorkflow
 *   steps={[
 *     {
 *       name: 'check-file',
 *       className: 'test--f-data.txt',
 *     },
 *     {
 *       name: 'process',
 *       className: 'cat-data.txt',
 *       condition: (results) => results[0].exitCode === 0
 *     },
 *     {
 *       name: 'analyze',
 *       className: 'wc--l',
 *       transform: (input) => input.toUpperCase()
 *     }
 *   ]}
 *   onComplete={(results) => console.log('Workflow done', results)}
 * />
 * ```
 */
export function ShellWorkflow(props: ShellWorkflowProps): JSX.Element | null {
  const {
    steps,
    onStepComplete,
    onComplete,
    onError,
    stopOnError = true,
    parallel = false,
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
  const [inputData, setInputData] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current || context.status !== 'idle') {
      return;
    }

    executedRef.current = true;

    const startWorkflow = () => {
      if (verbose) {
        console.log('[ShellWorkflow] Starting workflow with', steps.length, 'steps');
        console.log('[ShellWorkflow] Execution mode:', parallel ? 'parallel' : 'sequential');
      }

      setContext((prev) => ({
        ...prev,
        status: 'running',
        startTime: Date.now(),
      }));
    };

    startWorkflow();
  }, [steps.length, parallel, verbose]);

  // Check if workflow is complete
  useEffect(() => {
    if (context.status === 'running' && completedSteps.size === steps.length) {
      setContext((prev) => ({
        ...prev,
        status: 'completed',
        endTime: Date.now(),
      }));

      if (onComplete) {
        onComplete(context.results, context);
      }

      if (verbose) {
        const duration = Date.now() - (context.startTime || 0);
        console.log(`[ShellWorkflow] Workflow completed in ${duration}ms`);
      }
    }
  }, [completedSteps.size, steps.length, context.status, context.results, context.startTime, onComplete, verbose]);

  const createStepHandler = (stepIndex: number) => {
    const step = steps[stepIndex];

    const handleComplete = (result: CommandResult) => {
      const workflowResult: WorkflowResult = {
        ...result,
        stepName: step.name,
        stepIndex,
        timestamp: Date.now(),
      };

      if (verbose) {
        console.log(`[ShellWorkflow] Step "${step.name}" completed with exit code ${result.exitCode}`);
      }

      setContext((prev) => ({
        ...prev,
        results: [...prev.results, workflowResult],
      }));

      // Store output for next steps
      setInputData((prev) => ({
        ...prev,
        [step.name]: result.stdout,
      }));

      setCompletedSteps((prev) => new Set([...prev, stepIndex]));

      if (onStepComplete) {
        onStepComplete(workflowResult, {
          ...context,
          results: [...context.results, workflowResult],
        });
      }

      if (step.onComplete) {
        step.onComplete(result);
      }

      // In sequential mode, advance to next step
      if (!parallel) {
        setContext((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }));
      }
    };

    const handleError = (error: Error) => {
      if (verbose) {
        console.error(`[ShellWorkflow] Step "${step.name}" failed:`, error.message);
      }

      if (stopOnError) {
        setContext((prev) => ({
          ...prev,
          status: 'failed',
          error,
          endTime: Date.now(),
        }));

        if (onError) {
          onError(error, context);
        }
      } else {
        // Mark step as completed even on error
        setCompletedSteps((prev) => new Set([...prev, stepIndex]));

        if (!parallel) {
          setContext((prev) => ({
            ...prev,
            currentStep: prev.currentStep + 1,
          }));
        }
      }

      if (step.onError) {
        step.onError(error);
      }
    };

    return { handleComplete, handleError };
  };

  // Determine which steps to render
  const getStepsToRender = (): number[] => {
    if (context.status !== 'running') {
      return [];
    }

    if (parallel) {
      // In parallel mode, render all steps that haven't completed and meet conditions
      return steps
        .map((step, index) => {
          if (completedSteps.has(index)) {
            return -1;
          }
          if (step.condition && !step.condition(context.results)) {
            // Skip and mark as completed if condition not met
            setCompletedSteps((prev) => new Set([...prev, index]));
            return -1;
          }
          return index;
        })
        .filter((index) => index >= 0);
    } else {
      // In sequential mode, render only current step
      if (context.currentStep >= steps.length) {
        return [];
      }

      const step = steps[context.currentStep];
      if (step.condition && !step.condition(context.results)) {
        // Skip this step
        if (verbose) {
          console.log(`[ShellWorkflow] Skipping step "${step.name}" (condition not met)`);
        }
        setCompletedSteps((prev) => new Set([...prev, context.currentStep]));
        setContext((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }));
        return [];
      }

      return [context.currentStep];
    }
  };

  const stepsToRender = getStepsToRender();

  if (stepsToRender.length === 0) {
    return null;
  }

  return (
    <>
      {stepsToRender.map((stepIndex) => {
        const step = steps[stepIndex];
        const handlers = createStepHandler(stepIndex);

        // Determine stdin for this step
        let effectiveStdin: string | undefined;

        if (parallel) {
          // In parallel mode, no stdin passing
          effectiveStdin = undefined;
        } else {
          // In sequential mode, use output from previous step
          if (stepIndex > 0) {
            const previousStep = steps[stepIndex - 1];
            effectiveStdin = inputData[previousStep.name];
          }
        }

        // Apply transformation if provided
        if (step.transform && effectiveStdin) {
          effectiveStdin = step.transform(effectiveStdin, context.results);
        }

        return (
          <Shell
            key={`${step.name}-${stepIndex}`}
            className={step.className}
            sudo={step.sudo}
            cwd={step.cwd}
            env={step.env}
            stdin={effectiveStdin}
            timeout={step.timeout}
            securityPolicy={step.securityPolicy}
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

export default ShellWorkflow;
