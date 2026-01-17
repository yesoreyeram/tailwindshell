/**
 * Tests for workflow components
 */

import { render, waitFor } from '@testing-library/react';
import {
  ShellPipeline,
  ShellWorkflow,
  ShellParallel,
  ShellConditional,
  ShellLoop,
} from '../src/workflow';
import type { WorkflowResult } from '../src/types/workflow';

// Mock Shell component
jest.mock('../src/Shell', () => ({
  Shell: ({ classNames, stdin, onComplete, onError }: any) => {
    // Simulate command execution
    setTimeout(() => {
      if (classNames.includes('fail')) {
        onError?.(new Error('Command failed'));
      } else {
        const output = stdin ? `processed: ${stdin}` : `output from ${classNames}`;
        onComplete?.({
          stdout: output,
          stderr: '',
          exitCode: 0,
          command: classNames,
          duration: 100,
        });
      }
    }, 10);
    return null;
  },
}));

describe('ShellPipeline', () => {
  it('should execute commands sequentially', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellPipeline
        steps={['cmd1', 'cmd2', 'cmd3']}
        onStepComplete={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(3), { timeout: 5000 });

    expect(results[0].stepName).toBe('step-0');
    expect(results[1].stepName).toBe('step-1');
    expect(results[2].stepName).toBe('step-2');
  });

  it('should pass output between steps', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellPipeline
        steps={['cat-file.txt', 'grep-error', 'wc--l']}
        onStepComplete={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(3), { timeout: 5000 });

    // Each step should receive output from previous step
    expect(results[1].stdout).toContain('processed:');
    expect(results[2].stdout).toContain('processed:');
  });

  it('should stop on error when stopOnError is true', async () => {
    const results: WorkflowResult[] = [];
    const onError = jest.fn();

    render(
      <ShellPipeline
        steps={['cmd1', 'fail', 'cmd3']}
        onStepComplete={(result) => results.push(result)}
        onError={onError}
        stopOnError={true}
      />
    );

    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 5000 });

    expect(results.length).toBe(1); // Only first step completed
  });

  it('should handle named steps', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellPipeline
        steps={[
          { name: 'extract', classNames: 'cat-data.txt' },
          { name: 'filter', classNames: 'grep-error' },
        ]}
        onStepComplete={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(2), { timeout: 5000 });

    expect(results[0].stepName).toBe('extract');
    expect(results[1].stepName).toBe('filter');
  });

  it('should call onComplete with all results', async () => {
    const onComplete = jest.fn();

    render(
      <ShellPipeline
        steps={['cmd1', 'cmd2']}
        onComplete={onComplete}
      />
    );

    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 5000 });

    const results = onComplete.mock.calls[0][0];
    expect(results).toHaveLength(2);
  });
});

describe('ShellWorkflow', () => {
  it('should execute steps sequentially by default', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellWorkflow
        steps={[
          { name: 'step1', classNames: 'cmd1' },
          { name: 'step2', classNames: 'cmd2' },
        ]}
        onStepComplete={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(2), { timeout: 5000 });
  });

  it('should execute steps in parallel when parallel is true', async () => {
    const results: WorkflowResult[] = [];
    const startTimes: number[] = [];

    render(
      <ShellWorkflow
        steps={[
          { name: 'step1', classNames: 'cmd1' },
          { name: 'step2', classNames: 'cmd2' },
          { name: 'step3', classNames: 'cmd3' },
        ]}
        parallel={true}
        onStepComplete={(result) => {
          startTimes.push(Date.now());
          results.push(result);
        }}
      />
    );

    await waitFor(() => expect(results.length).toBe(3), { timeout: 5000 });

    // All steps should start around the same time
    const timeDiff = Math.max(...startTimes) - Math.min(...startTimes);
    expect(timeDiff).toBeLessThan(100); // Within 100ms
  });

  it('should skip steps when condition is false', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellWorkflow
        steps={[
          { name: 'step1', classNames: 'cmd1' },
          {
            name: 'step2',
            classNames: 'cmd2',
            condition: () => false, // Always skip
          },
          { name: 'step3', classNames: 'cmd3' },
        ]}
        onStepComplete={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(2), { timeout: 5000 });

    const stepNames = results.map((r) => r.stepName);
    expect(stepNames).toContain('step1');
    expect(stepNames).not.toContain('step2');
    expect(stepNames).toContain('step3');
  });

  it('should execute conditional steps based on previous results', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellWorkflow
        steps={[
          { name: 'build', classNames: 'npm-run-build' },
          {
            name: 'deploy',
            classNames: 'npm-run-deploy',
            condition: (prevResults) => prevResults[0]?.exitCode === 0,
          },
        ]}
        onStepComplete={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(2), { timeout: 5000 });

    expect(results[0].stepName).toBe('build');
    expect(results[1].stepName).toBe('deploy');
  });
});

describe('ShellParallel', () => {
  it('should execute all commands in parallel', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellParallel
        commands={['cmd1', 'cmd2', 'cmd3']}
        onComplete={(completedResults) => {
          results.push(...completedResults);
        }}
      />
    );

    await waitFor(() => expect(results.length).toBe(3), { timeout: 5000 });
  });

  it('should handle named commands', async () => {
    const results: WorkflowResult[] = [];

    render(
      <ShellParallel
        commands={[
          { name: 'build', classNames: 'npm-run-build' },
          { name: 'test', classNames: 'npm-test' },
        ]}
        onComplete={(completedResults) => {
          results.push(...completedResults);
        }}
      />
    );

    await waitFor(() => expect(results.length).toBe(2), { timeout: 5000 });

    const names = results.map((r) => r.stepName);
    expect(names).toContain('build');
    expect(names).toContain('test');
  });

  it('should collect all errors', async () => {
    const errors: Error[] = [];

    render(
      <ShellParallel
        commands={['cmd1', 'fail1', 'fail2']}
        onError={(errs) => {
          errors.push(...errs);
        }}
      />
    );

    await waitFor(() => expect(errors.length).toBe(2), { timeout: 5000 });
  });
});

describe('ShellConditional', () => {
  it('should execute then branch when condition is true', async () => {
    const thenExecuted = jest.fn();

    render(
      <ShellConditional
        condition={() => true}
        then={<div data-testid="then" onClick={thenExecuted}>Then</div>}
        else={<div data-testid="else">Else</div>}
      />
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="then"]')).toBeInTheDocument();
    });

    expect(document.querySelector('[data-testid="else"]')).not.toBeInTheDocument();
  });

  it('should execute else branch when condition is false', async () => {
    render(
      <ShellConditional
        condition={() => false}
        then={<div data-testid="then">Then</div>}
        else={<div data-testid="else">Else</div>}
      />
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="else"]')).toBeInTheDocument();
    });

    expect(document.querySelector('[data-testid="then"]')).not.toBeInTheDocument();
  });

  it('should handle async conditions', async () => {
    render(
      <ShellConditional
        condition={async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return true;
        }}
        then={<div data-testid="then">Then</div>}
      />
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="then"]')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('ShellLoop', () => {
  it('should execute command for each item sequentially', async () => {
    const results: WorkflowResult[] = [];
    const items = ['file1.txt', 'file2.txt', 'file3.txt'];

    render(
      <ShellLoop
        items={items}
        command={(item) => `cat-${item}`}
        onIteration={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(3), { timeout: 5000 });
  });

  it('should execute commands in parallel when parallel is true', async () => {
    const results: WorkflowResult[] = [];
    const items = ['item1', 'item2', 'item3'];

    render(
      <ShellLoop
        items={items}
        command={(item) => `process-${item}`}
        parallel={true}
        onIteration={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(3), { timeout: 5000 });
  });

  it('should replace $ITEM placeholder', async () => {
    const results: WorkflowResult[] = [];
    const items = ['file1', 'file2'];

    render(
      <ShellLoop
        items={items}
        command="cat-$ITEM.txt"
        onIteration={(result) => results.push(result)}
      />
    );

    await waitFor(() => expect(results.length).toBe(2), { timeout: 5000 });
  });

  it('should stop on error when stopOnError is true', async () => {
    const results: WorkflowResult[] = [];
    const onError = jest.fn();

    render(
      <ShellLoop
        items={['item1', 'fail', 'item3']}
        command={(item) => item}
        onIteration={(result) => results.push(result)}
        onError={onError}
        stopOnError={true}
        parallel={false}
      />
    );

    await waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 5000 });

    // Should have executed first item and fail, but not item3
    expect(results.length).toBeLessThan(3);
  });

  it('should call onComplete with all results', async () => {
    const onComplete = jest.fn();

    render(
      <ShellLoop
        items={['item1', 'item2']}
        command={(item) => `process-${item}`}
        onComplete={onComplete}
      />
    );

    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 5000 });

    const results = onComplete.mock.calls[0][0];
    expect(results).toHaveLength(2);
  });
});
