/**
 * Workflow types and interfaces
 */

import { CommandResult, ShellProps } from './index';
import React from 'react';

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  name: string;
  classNames: string;
  sudo?: boolean;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  securityPolicy?: any;
  onComplete?: (result: CommandResult) => void;
  onError?: (error: Error) => void;
  condition?: (previousResults: WorkflowResult[]) => boolean;
  transform?: (input: string, previousResults: WorkflowResult[]) => string;
}

/**
 * Workflow result with step metadata
 */
export interface WorkflowResult extends CommandResult {
  stepName: string;
  stepIndex: number;
  timestamp: number;
}

/**
 * Workflow status
 */
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  results: WorkflowResult[];
  currentStep: number;
  status: WorkflowStatus;
  error?: Error;
  startTime?: number;
  endTime?: number;
}

/**
 * Pipeline props
 */
export interface ShellPipelineProps {
  steps: Array<string | WorkflowStep>;
  onStepComplete?: (result: WorkflowResult, context: WorkflowContext) => void;
  onComplete?: (results: WorkflowResult[], context: WorkflowContext) => void;
  onError?: (error: Error, context: WorkflowContext) => void;
  stopOnError?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

/**
 * Workflow props
 */
export interface ShellWorkflowProps {
  steps: WorkflowStep[];
  onStepComplete?: (result: WorkflowResult, context: WorkflowContext) => void;
  onComplete?: (results: WorkflowResult[], context: WorkflowContext) => void;
  onError?: (error: Error, context: WorkflowContext) => void;
  stopOnError?: boolean;
  parallel?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}

/**
 * Parallel execution props
 */
export interface ShellParallelProps {
  commands: Array<string | WorkflowStep>;
  onComplete?: (results: WorkflowResult[]) => void;
  onError?: (errors: Error[]) => void;
  verbose?: boolean;
  dryRun?: boolean;
}

/**
 * Conditional execution props
 */
export interface ShellConditionalProps {
  condition: () => boolean | Promise<boolean>;
  then: React.ReactNode;
  else?: React.ReactNode;
  onComplete?: (result: CommandResult) => void;
}

/**
 * Loop execution props
 */
export interface ShellLoopProps {
  items: string[];
  command: string | ((item: string, index: number) => string);
  onIteration?: (result: WorkflowResult, item: string, index: number) => void;
  onComplete?: (results: WorkflowResult[]) => void;
  onError?: (error: Error, item: string, index: number) => void;
  parallel?: boolean;
  stopOnError?: boolean;
}
