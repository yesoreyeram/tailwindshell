/**
 * ShellLoop - Loop over items and execute commands
 */

import { useState, useEffect, useRef } from 'react';
import { Shell } from '../Shell';
import type { ShellLoopProps, WorkflowResult } from '../types/workflow';
import type { CommandResult } from '../types';

/**
 * ShellLoop component for iterating over items
 *
 * Executes a command for each item in an array, either sequentially or in parallel.
 * Useful for batch processing files, data, or repetitive tasks.
 *
 * @example
 * ```tsx
 * <ShellLoop
 *   items={['file1.txt', 'file2.txt', 'file3.txt']}
 *   command={(file) => `cat-${file}`}
 *   onComplete={(results) => {
 *     console.log('Processed', results.length, 'files');
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ShellLoop
 *   items={['error', 'warning', 'info']}
 *   command="grep-$ITEM-app.log"
 *   parallel={true}
 *   onIteration={(result, item) => {
 *     console.log(`Found ${result.stdout.split('\n').length} ${item} messages`);
 *   }}
 * />
 * ```
 */
export function ShellLoop(props: ShellLoopProps): JSX.Element | null {
  const {
    items,
    command,
    onIteration,
    onComplete,
    onError,
    parallel = false,
    stopOnError = false,
  } = props;

  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [errors, setErrors] = useState<Array<{ error: Error; item: string; index: number }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [hasFailed, setHasFailed] = useState(false);
  const executedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in strict mode
    if (executedRef.current) {
      return;
    }
    executedRef.current = true;
  }, []);

  useEffect(() => {
    if (completedCount === items.length && completedCount > 0) {
      if (onComplete) {
        onComplete(results);
      }
    }
  }, [completedCount, items.length, results, onComplete]);

  const createHandlers = (item: string, index: number) => {
    const handleComplete = (result: CommandResult) => {
      const workflowResult: WorkflowResult = {
        ...result,
        stepName: `iteration-${index}`,
        stepIndex: index,
        timestamp: Date.now(),
      };

      setResults((prev) => [...prev, workflowResult]);
      setCompletedCount((prev) => prev + 1);

      if (onIteration) {
        onIteration(workflowResult, item, index);
      }

      // In sequential mode, move to next item
      if (!parallel) {
        setCurrentIndex((prev) => prev + 1);
      }
    };

    const handleError = (error: Error) => {
      setErrors((prev) => [...prev, { error, item, index }]);
      setCompletedCount((prev) => prev + 1);

      if (onError) {
        onError(error, item, index);
      }

      if (stopOnError) {
        setHasFailed(true);
      } else if (!parallel) {
        setCurrentIndex((prev) => prev + 1);
      }
    };

    return { handleComplete, handleError };
  };

  const getCommandString = (item: string, index: number): string => {
    if (typeof command === 'function') {
      return command(item, index);
    }
    // Replace $ITEM placeholder with actual item
    return command.replace(/\$ITEM/g, item).replace(/\$INDEX/g, String(index));
  };

  // Determine which items to render
  const getItemsToRender = (): Array<{ item: string; index: number }> => {
    if (hasFailed) {
      return [];
    }

    if (parallel) {
      // In parallel mode, render all items at once
      return items.map((item, index) => ({ item, index }));
    } else {
      // In sequential mode, render only current item
      if (currentIndex >= items.length) {
        return [];
      }
      return [{ item: items[currentIndex], index: currentIndex }];
    }
  };

  const itemsToRender = getItemsToRender();

  if (itemsToRender.length === 0) {
    return null;
  }

  return (
    <>
      {itemsToRender.map(({ item, index }) => {
        const handlers = createHandlers(item, index);
        const commandString = getCommandString(item, index);

        return (
          <Shell
            key={`item-${index}`}
            className={commandString}
            onComplete={handlers.handleComplete}
            onError={handlers.handleError}
          />
        );
      })}
    </>
  );
}

export default ShellLoop;
