/**
 * ShellConditional - Conditional command execution
 */

import { useState, useEffect, useRef, ReactNode } from 'react';
import type { ShellConditionalProps } from '../types/workflow';

/**
 * ShellConditional component for conditional execution
 *
 * Executes "then" or "else" branch based on a condition function.
 * Useful for dynamic workflow control based on runtime conditions.
 *
 * @example
 * ```tsx
 * <ShellConditional
 *   condition={() => process.env.NODE_ENV === 'production'}
 *   then={<Shell classNames="npm-run-build" />}
 *   else={<Shell classNames="npm-run-dev" />}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ShellConditional
 *   condition={async () => {
 *     const result = await checkFileExists('data.txt');
 *     return result;
 *   }}
 *   then={
 *     <ShellPipeline
 *       steps={['cat-data.txt', 'grep-error', 'wc--l']}
 *     />
 *   }
 *   else={<Shell classNames="echo-File-not-found" />}
 * />
 * ```
 */
export function ShellConditional(props: ShellConditionalProps): JSX.Element | null {
  const { condition, then: thenBranch, else: elseBranch, onComplete } = props;

  const [shouldExecuteThen, setShouldExecuteThen] = useState<boolean | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const executedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current || isEvaluating) {
      return;
    }

    executedRef.current = true;
    setIsEvaluating(true);

    const evaluateCondition = async () => {
      try {
        const result = await condition();
        setShouldExecuteThen(result);
      } catch (error) {
        console.error('[ShellConditional] Condition evaluation failed:', error);
        setShouldExecuteThen(false);
      } finally {
        setIsEvaluating(false);
      }
    };

    evaluateCondition();
  }, [condition, isEvaluating]);

  if (shouldExecuteThen === null) {
    // Still evaluating condition
    return null;
  }

  if (shouldExecuteThen) {
    return <>{thenBranch}</>;
  } else if (elseBranch) {
    return <>{elseBranch}</>;
  }

  return null;
}

export default ShellConditional;
