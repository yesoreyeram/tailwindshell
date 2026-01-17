/**
 * IF, ElseIf, Else - Declarative conditional rendering for workflows
 */

import { useState, useEffect, useRef, ReactNode, ReactElement, isValidElement } from 'react';
import { parse } from '../parser';
import { CommandExecutor } from '../executor';
import { DEFAULT_SECURITY_POLICY } from '../executor/security';

/**
 * Condition type - can be boolean, function, or Tailwind-style command
 */
export type Condition = boolean | (() => boolean | Promise<boolean>) | string;

/**
 * IF component props
 */
export interface IFProps {
  /**
   * Condition - can be:
   * - boolean: true/false
   * - function: () => boolean or async () => boolean
   * - string: Tailwind-style command (e.g., "test--f-file.txt")
   *   Command exit code 0 = true, non-zero = false
   */
  condition?: Condition;

  /**
   * Tailwind-style command as condition (exit code 0 = true)
   * Alternative to condition prop for command-based conditions
   */
  className?: string;

  children: ReactNode;
  verbose?: boolean;
  timeout?: number;
}

/**
 * ElseIf component props
 */
export interface ElseIfProps {
  /**
   * Condition - can be boolean, function, or Tailwind-style command
   */
  condition?: Condition;

  /**
   * Tailwind-style command as condition
   */
  className?: string;

  children: ReactNode;
}

/**
 * Else component props
 */
export interface ElseProps {
  children: ReactNode;
}

/**
 * ElseIf component - Must be used as a child of IF
 *
 * @example
 * ```tsx
 * <IF className="test--f-production.env">
 *   <Shell className="deploy:production" />
 *   <ElseIf className="test--f-staging.env">
 *     <Shell className="deploy:staging" />
 *   </ElseIf>
 * </IF>
 * ```
 */
export function ElseIf(_props: ElseIfProps): null {
  // This component doesn't render itself
  // It's processed by the IF component
  return null;
}

/**
 * Else component - Must be used as a child of IF
 *
 * @example
 * ```tsx
 * <IF className="test--f-file.txt">
 *   <Shell className="process-file" />
 *   <Else>
 *     <Shell className="echo-File-not-found" />
 *   </Else>
 * </IF>
 * ```
 */
export function Else(_props: ElseProps): null {
  // This component doesn't render itself
  // It's processed by the IF component
  return null;
}

/**
 * Evaluate a condition (boolean, function, or command)
 */
async function evaluateCondition(
  condition: Condition | undefined,
  className: string | undefined,
  timeout: number,
  verbose: boolean
): Promise<boolean> {
  // Priority: className > condition
  if (className) {
    if (verbose) {
      console.log('[IF] Evaluating command condition:', className);
    }

    try {
      const parsed = parse(className);
      const executor = new CommandExecutor({
        cwd: process.cwd(),
        env: {},
        sudo: false,
        securityPolicy: DEFAULT_SECURITY_POLICY,
        timeout,
        verbose: false,
      });

      const result = await executor.execute(parsed, {});
      const success = result.exitCode === 0;

      if (verbose) {
        console.log('[IF] Command result:', {
          command: result.command,
          exitCode: result.exitCode,
          condition: success,
        });
      }

      return success;
    } catch (error) {
      if (verbose) {
        console.error('[IF] Command execution error:', error);
      }
      return false;
    }
  }

  // Fallback to condition prop
  if (condition === undefined) {
    throw new Error('IF component requires either className or condition prop');
  }

  if (typeof condition === 'string') {
    // String condition - treat as command
    return evaluateCondition(undefined, condition, timeout, verbose);
  }

  if (typeof condition === 'function') {
    return await condition();
  }

  return condition;
}

/**
 * IF component with ElseIf and Else support
 *
 * Provides declarative conditional rendering with chained conditions.
 * Evaluates conditions in order and renders the first matching branch.
 *
 * @example
 * ```tsx
 * // Command-based condition
 * <IF className="test--f-production.env">
 *   <Shell className="npm-run-deploy:prod" />
 *   <ElseIf className="test--f-staging.env">
 *     <Shell className="npm-run-deploy:staging" />
 *   </ElseIf>
 *   <Else>
 *     <Shell className="npm-run-deploy:dev" />
 *   </Else>
 * </IF>
 * ```
 *
 * @example
 * ```tsx
 * // Boolean/function condition
 * <IF condition={process.env.NODE_ENV === 'production'}>
 *   <Shell className="deploy:prod" />
 *   <Else>
 *     <Shell className="deploy:dev" />
 *   </Else>
 * </IF>
 * ```
 *
 * @example
 * ```tsx
 * // Async function condition
 * <IF condition={async () => await checkHealth()}>
 *   <Shell className="deploy" />
 * </IF>
 * ```
 */
export function IF(props: IFProps): JSX.Element | null {
  const { condition, className, children, verbose = false, timeout = 5000 } = props;

  const [evaluatedCondition, setEvaluatedCondition] = useState<boolean | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);
  const executedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current) {
      return;
    }
    executedRef.current = true;

    const evaluate = async () => {
      try {
        if (verbose) {
          console.log('[IF] Evaluating condition');
        }

        const result = await evaluateCondition(condition, className, timeout, verbose);

        if (verbose) {
          console.log('[IF] Condition result:', result);
        }

        setEvaluatedCondition(result);
      } catch (error) {
        console.error('[IF] Error evaluating condition:', error);
        setEvaluatedCondition(false);
      } finally {
        setIsEvaluating(false);
      }
    };

    evaluate();
  }, [condition, className, timeout, verbose]);

  // Still evaluating
  if (isEvaluating || evaluatedCondition === null) {
    return null;
  }

  // Separate children into branches
  const branches: {
    ifContent: ReactNode[];
    elseIfBranches: Array<{ condition?: Condition; className?: string; content: ReactNode[] }>;
    elseContent: ReactNode[];
  } = {
    ifContent: [],
    elseIfBranches: [],
    elseContent: [],
  };

  let currentBranch: 'if' | 'elseif' | 'else' = 'if';
  let currentElseIfIndex = -1;

  // Process children to categorize them
  const childArray = Array.isArray(children) ? children : [children];

  childArray.forEach((child) => {
    if (!isValidElement(child)) {
      if (currentBranch === 'if') {
        branches.ifContent.push(child);
      } else if (currentBranch === 'elseif' && currentElseIfIndex >= 0) {
        branches.elseIfBranches[currentElseIfIndex].content.push(child);
      } else if (currentBranch === 'else') {
        branches.elseContent.push(child);
      }
      return;
    }

    const element = child as ReactElement;

    // Check if this is an ElseIf component
    if (element.type === ElseIf) {
      currentBranch = 'elseif';
      currentElseIfIndex++;
      branches.elseIfBranches.push({
        condition: element.props.condition,
        className: element.props.className,
        content: Array.isArray(element.props.children)
          ? element.props.children
          : [element.props.children],
      });
    }
    // Check if this is an Else component
    else if (element.type === Else) {
      currentBranch = 'else';
      branches.elseContent = Array.isArray(element.props.children)
        ? element.props.children
        : [element.props.children];
    }
    // Regular child
    else {
      if (currentBranch === 'if') {
        branches.ifContent.push(child);
      } else if (currentBranch === 'elseif' && currentElseIfIndex >= 0) {
        branches.elseIfBranches[currentElseIfIndex].content.push(child);
      } else if (currentBranch === 'else') {
        branches.elseContent.push(child);
      }
    }
  });

  // If main condition is true, render IF content
  if (evaluatedCondition) {
    if (verbose) {
      console.log('[IF] Rendering IF branch');
    }
    return <>{branches.ifContent}</>;
  }

  // Check ElseIf branches
  if (branches.elseIfBranches.length > 0) {
    return (
      <ElseIfEvaluator
        branches={branches.elseIfBranches}
        elseContent={branches.elseContent}
        timeout={timeout}
        verbose={verbose}
      />
    );
  }

  // Render Else content
  if (branches.elseContent.length > 0) {
    if (verbose) {
      console.log('[IF] Rendering ELSE branch');
    }
    return <>{branches.elseContent}</>;
  }

  return null;
}

/**
 * Internal component to evaluate ElseIf branches
 */
interface ElseIfEvaluatorProps {
  branches: Array<{ condition?: Condition; className?: string; content: ReactNode[] }>;
  elseContent: ReactNode[];
  timeout: number;
  verbose?: boolean;
}

function ElseIfEvaluator(props: ElseIfEvaluatorProps): JSX.Element | null {
  const { branches, elseContent, timeout, verbose = false } = props;

  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const [evaluatedCondition, setEvaluatedCondition] = useState<boolean | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);
  const executedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current) {
      return;
    }
    executedRef.current = true;

    const evaluateCurrentBranch = async () => {
      if (currentBranchIndex >= branches.length) {
        setEvaluatedCondition(false);
        setIsEvaluating(false);
        return;
      }

      const branch = branches[currentBranchIndex];

      try {
        if (verbose) {
          console.log(`[ElseIf] Evaluating branch ${currentBranchIndex + 1}`);
        }

        const result = await evaluateCondition(
          branch.condition,
          branch.className,
          timeout,
          verbose
        );

        if (verbose) {
          console.log(`[ElseIf] Branch ${currentBranchIndex + 1} result:`, result);
        }

        setEvaluatedCondition(result);
        setIsEvaluating(false);
      } catch (error) {
        console.error(`[ElseIf] Error evaluating branch ${currentBranchIndex + 1}:`, error);
        setEvaluatedCondition(false);
        setIsEvaluating(false);
      }
    };

    evaluateCurrentBranch();
  }, [currentBranchIndex, branches, timeout, verbose]);

  // Still evaluating
  if (isEvaluating || evaluatedCondition === null) {
    return null;
  }

  // Current branch condition is true
  if (evaluatedCondition) {
    if (verbose) {
      console.log(`[ElseIf] Rendering branch ${currentBranchIndex + 1}`);
    }
    return <>{branches[currentBranchIndex].content}</>;
  }

  // Current branch is false, try next branch
  if (currentBranchIndex < branches.length - 1) {
    // Reset for next evaluation
    executedRef.current = false;
    setCurrentBranchIndex(currentBranchIndex + 1);
    setIsEvaluating(true);
    setEvaluatedCondition(null);
    return null;
  }

  // All ElseIf branches are false, render Else content
  if (elseContent.length > 0) {
    if (verbose) {
      console.log('[ElseIf] All conditions false, rendering ELSE branch');
    }
    return <>{elseContent}</>;
  }

  return null;
}

export default IF;
