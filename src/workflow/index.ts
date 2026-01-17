/**
 * Workflow components for advanced Shell command orchestration
 */

export { ShellPipeline } from './ShellPipeline';
export { ShellWorkflow } from './ShellWorkflow';
export { ShellParallel } from './ShellParallel';
export { ShellConditional } from './ShellConditional';
export { ShellLoop } from './ShellLoop';

export type {
  WorkflowStep,
  WorkflowResult,
  WorkflowStatus,
  WorkflowContext,
  ShellPipelineProps,
  ShellWorkflowProps,
  ShellParallelProps,
  ShellConditionalProps,
  ShellLoopProps,
} from '../types/workflow';
