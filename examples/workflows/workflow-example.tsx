/**
 * ShellWorkflow Examples
 *
 * Demonstrates complex workflows with conditional steps, parallel execution,
 * and advanced control flow.
 */

import { ShellWorkflow, ShellParallel, ShellConditional, ShellLoop } from 'tailwindshell';
import { useState } from 'react';

/**
 * Example 1: CI/CD Workflow with conditional deployment
 */
export function CICDWorkflow() {
  const [deploymentStatus, setDeploymentStatus] = useState('idle');

  return (
    <ShellWorkflow
      steps={[
        {
          name: 'lint',
          classNames: 'npm-run-lint',
        },
        {
          name: 'test',
          classNames: 'npm-test',
          condition: (results) => {
            const lintResult = results.find(r => r.stepName === 'lint');
            return lintResult?.exitCode === 0;
          }
        },
        {
          name: 'build',
          classNames: 'npm-run-build',
          condition: (results) => {
            const testResult = results.find(r => r.stepName === 'test');
            return testResult?.exitCode === 0;
          },
          timeout: 300000 // 5 minutes
        },
        {
          name: 'deploy',
          classNames: 'npm-run-deploy',
          condition: (results) => {
            return results.every(r => r.exitCode === 0);
          },
          sudo: true,
          onComplete: () => setDeploymentStatus('success')
        }
      ]}
      onStepComplete={(result) => {
        console.log(`✓ ${result.stepName} completed in ${result.duration}ms`);
      }}
      onComplete={(results, context) => {
        const totalDuration = context.endTime! - context.startTime!;
        console.log(`\n=== CI/CD Pipeline Complete ===`);
        console.log(`Total duration: ${totalDuration}ms`);
        console.log(`Steps executed: ${results.length}`);
        console.log(`All passed: ${results.every(r => r.exitCode === 0)}`);
      }}
      stopOnError={true}
      verbose={true}
    />
  );
}

/**
 * Example 2: Parallel execution workflow
 */
export function ParallelTestsWorkflow() {
  return (
    <ShellWorkflow
      steps={[
        {
          name: 'unit-tests',
          classNames: 'npm-run-test:unit',
        },
        {
          name: 'integration-tests',
          classNames: 'npm-run-test:integration',
        },
        {
          name: 'e2e-tests',
          classNames: 'npm-run-test:e2e',
          timeout: 600000 // 10 minutes
        }
      ]}
      parallel={true} // Run all tests in parallel
      onComplete={(results) => {
        const passed = results.filter(r => r.exitCode === 0).length;
        const failed = results.length - passed;
        console.log(`Tests complete: ${passed} passed, ${failed} failed`);
      }}
      stopOnError={false} // Continue even if some tests fail
    />
  );
}

/**
 * Example 3: Data backup workflow
 */
export function BackupWorkflow() {
  return (
    <ShellWorkflow
      steps={[
        {
          name: 'create-backup-dir',
          classNames: 'mkdir--p-backups/$(date-+%Y%m%d)',
        },
        {
          name: 'backup-database',
          classNames: 'pg_dump-mydb_redirect_backups/$(date-+%Y%m%d)/db.sql',
          timeout: 600000,
          onComplete: (result) => {
            console.log('Database backup created');
          }
        },
        {
          name: 'backup-files',
          classNames: 'tar--czf-backups/$(date-+%Y%m%d)/files.tar.gz-data/',
          onComplete: (result) => {
            console.log('Files backup created');
          }
        },
        {
          name: 'upload-to-s3',
          classNames: 'aws-s3-sync-backups/-s3://my-backups/',
          condition: (results) => {
            // Only upload if backups were successful
            return results.every(r => r.exitCode === 0);
          },
          env: {
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || ''
          }
        },
        {
          name: 'cleanup-old-backups',
          classNames: 'find-backups--type-d--mtime-+30--exec-rm--rf-{}-;',
          onComplete: () => {
            console.log('Old backups cleaned up');
          }
        }
      ]}
      onComplete={(results, context) => {
        const duration = (context.endTime! - context.startTime!) / 1000;
        console.log(`Backup workflow completed in ${duration.toFixed(2)}s`);
      }}
      verbose={true}
    />
  );
}

/**
 * Example 4: Multi-environment deployment
 */
export function MultiEnvDeployment() {
  const [currentEnv, setCurrentEnv] = useState<string>('');

  return (
    <ShellWorkflow
      steps={[
        {
          name: 'build',
          classNames: 'npm-run-build',
        },
        {
          name: 'deploy-staging',
          classNames: 'npm-run-deploy--env-staging',
          condition: (results) => results[0]?.exitCode === 0,
          env: { ENVIRONMENT: 'staging' },
          onComplete: () => setCurrentEnv('staging')
        },
        {
          name: 'test-staging',
          classNames: 'npm-run-test:smoke--env-staging',
          condition: (results) => {
            return results.find(r => r.stepName === 'deploy-staging')?.exitCode === 0;
          }
        },
        {
          name: 'deploy-production',
          classNames: 'npm-run-deploy--env-production',
          condition: (results) => {
            const stagingTest = results.find(r => r.stepName === 'test-staging');
            return stagingTest?.exitCode === 0;
          },
          env: { ENVIRONMENT: 'production' },
          sudo: true,
          onComplete: () => setCurrentEnv('production')
        }
      ]}
      onStepComplete={(result) => {
        console.log(`[${result.stepName}] Status: ${result.exitCode === 0 ? 'SUCCESS' : 'FAILED'}`);
      }}
      stopOnError={true}
      verbose={true}
    />
  );
}

/**
 * Example 5: Code quality workflow
 */
export function CodeQualityWorkflow() {
  return (
    <ShellWorkflow
      steps={[
        {
          name: 'format-check',
          classNames: 'npm-run-format:check',
        },
        {
          name: 'lint',
          classNames: 'npm-run-lint',
        },
        {
          name: 'type-check',
          classNames: 'npm-run-type-check',
        },
        {
          name: 'security-audit',
          classNames: 'npm-audit--audit-level-high',
        },
        {
          name: 'test-coverage',
          classNames: 'npm-run-test:coverage',
          transform: (input) => {
            // Extract coverage percentage
            const match = input.match(/Statements\s+:\s+(\d+\.?\d*)%/);
            return match ? match[1] : 'unknown';
          }
        }
      ]}
      parallel={true} // Run all checks in parallel
      onComplete={(results) => {
        console.log('\n=== Code Quality Report ===');
        results.forEach(result => {
          const status = result.exitCode === 0 ? '✓' : '✗';
          console.log(`${status} ${result.stepName}`);
        });

        const allPassed = results.every(r => r.exitCode === 0);
        if (allPassed) {
          console.log('\n✓ All quality checks passed!');
        } else {
          console.log('\n✗ Some quality checks failed');
        }
      }}
      stopOnError={false}
      verbose={true}
    />
  );
}

export default CICDWorkflow;
