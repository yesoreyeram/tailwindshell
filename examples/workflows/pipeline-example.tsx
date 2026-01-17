/**
 * ShellPipeline Examples
 *
 * Demonstrates how to chain commands sequentially, passing output
 * from one command as input to the next.
 */

import { ShellPipeline } from 'tailwindshell';

/**
 * Example 1: Simple log analysis pipeline
 * Reads a log file, filters errors, and counts them
 */
export function LogAnalysisPipeline() {
  return (
    <ShellPipeline
      steps={[
        'cat-/var/log/app.log',  // Read log file
        'grep-ERROR',             // Filter error lines
        'wc--l'                   // Count lines
      ]}
      onComplete={(results) => {
        const errorCount = results[results.length - 1].stdout.trim();
        console.log(`Found ${errorCount} errors in the log`);
      }}
      verbose={true}
    />
  );
}

/**
 * Example 2: Data processing pipeline with named steps
 */
export function DataProcessingPipeline() {
  return (
    <ShellPipeline
      steps={[
        {
          name: 'extract',
          classNames: 'cat-data.csv'
        },
        {
          name: 'filter',
          classNames: 'grep-2024',
          transform: (input) => {
            // Transform data before passing to next step
            return input.toUpperCase();
          }
        },
        {
          name: 'sort',
          classNames: 'sort'
        },
        {
          name: 'unique',
          classNames: 'uniq--c'
        }
      ]}
      onStepComplete={(result, context) => {
        console.log(`Step ${result.stepName} completed:`, {
          exitCode: result.exitCode,
          outputLines: result.stdout.split('\n').length
        });
      }}
      onComplete={(results, context) => {
        console.log('Pipeline completed successfully');
        console.log('Total duration:', Date.now() - (context.startTime || 0), 'ms');
      }}
      stopOnError={true}
      verbose={true}
    />
  );
}

/**
 * Example 3: Build and deploy pipeline
 */
export function BuildDeployPipeline() {
  return (
    <ShellPipeline
      steps={[
        {
          name: 'clean',
          classNames: 'rm--rf-dist',
          onComplete: () => console.log('Clean completed')
        },
        {
          name: 'install',
          classNames: 'npm-install',
          timeout: 120000, // 2 minutes
          onComplete: () => console.log('Dependencies installed')
        },
        {
          name: 'build',
          classNames: 'npm-run-build',
          timeout: 300000, // 5 minutes
          onComplete: () => console.log('Build completed')
        },
        {
          name: 'test',
          classNames: 'npm-test',
          onComplete: (result) => {
            if (result.exitCode === 0) {
              console.log('All tests passed!');
            }
          }
        },
        {
          name: 'deploy',
          classNames: 'npm-run-deploy',
          condition: (previousResults) => {
            // Only deploy if tests passed
            const testResult = previousResults.find(r => r.stepName === 'test');
            return testResult?.exitCode === 0;
          },
          sudo: true,
          onComplete: () => console.log('Deployment successful')
        }
      ]}
      onComplete={(results) => {
        console.log('=== Build & Deploy Summary ===');
        results.forEach(result => {
          console.log(`${result.stepName}: ${result.exitCode === 0 ? '✓' : '✗'} (${result.duration}ms)`);
        });
      }}
      onError={(error, context) => {
        const currentStep = context.results[context.results.length - 1];
        console.error(`Pipeline failed at step: ${currentStep?.stepName}`);
        console.error('Error:', error.message);
      }}
      stopOnError={true}
      verbose={true}
    />
  );
}

/**
 * Example 4: Text processing pipeline
 */
export function TextProcessingPipeline() {
  return (
    <ShellPipeline
      steps={[
        'cat-article.txt',
        'tr--d-[:punct:]',      // Remove punctuation
        'tr-[:upper:]-[:lower:]', // Convert to lowercase
        'tr--s-[:space:]-\\n',   // Split words
        'sort',
        'uniq--c',               // Count unique words
        'sort--rn',              // Sort by count (descending)
        'head--n-10'             // Get top 10
      ]}
      onComplete={(results) => {
        console.log('Top 10 most common words:');
        console.log(results[results.length - 1].stdout);
      }}
      verbose={true}
    />
  );
}

/**
 * Example 5: System health check pipeline
 */
export function HealthCheckPipeline() {
  return (
    <ShellPipeline
      steps={[
        {
          name: 'check-disk',
          classNames: 'df--h',
          transform: (output) => {
            // Extract usage percentage
            const lines = output.split('\n');
            const usage = lines[1]?.split(/\s+/)[4];
            return usage || 'unknown';
          }
        },
        {
          name: 'check-memory',
          classNames: 'free--h'
        },
        {
          name: 'check-processes',
          classNames: 'ps-aux_pipe_wc--l'
        }
      ]}
      onComplete={(results) => {
        console.log('=== System Health Check ===');
        results.forEach(result => {
          console.log(`${result.stepName}:`);
          console.log(result.stdout);
          console.log('---');
        });
      }}
      securityPolicy={{
        allowedCommands: ['df', 'free', 'ps', 'wc'],
        maxExecutionTime: 10000
      }}
    />
  );
}

export default LogAnalysisPipeline;
