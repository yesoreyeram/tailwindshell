/**
 * ShellParallel Examples
 *
 * Demonstrates parallel command execution for independent tasks.
 */

import { ShellParallel, ShellConditional, ShellLoop } from 'tailwindshell';
import { useState } from 'react';

/**
 * Example 1: Run multiple independent tasks simultaneously
 */
export function ParallelBuilds() {
  return (
    <ShellParallel
      commands={[
        'npm-run-build:client',
        'npm-run-build:server',
        'npm-run-build:worker'
      ]}
      onComplete={(results) => {
        const allSuccessful = results.every(r => r.exitCode === 0);
        console.log(`All builds completed: ${allSuccessful ? 'SUCCESS' : 'FAILED'}`);

        results.forEach(result => {
          console.log(`${result.stepName}: ${result.duration}ms`);
        });
      }}
      verbose={true}
    />
  );
}

/**
 * Example 2: Parallel data fetching
 */
export function ParallelDataFetch() {
  const [fetchedData, setFetchedData] = useState<Record<string, string>>({});

  return (
    <ShellParallel
      commands={[
        {
          name: 'fetch-users',
          classNames: 'curl-https://api.example.com/users',
        },
        {
          name: 'fetch-products',
          classNames: 'curl-https://api.example.com/products',
        },
        {
          name: 'fetch-orders',
          classNames: 'curl-https://api.example.com/orders',
        }
      ]}
      onComplete={(results) => {
        const data: Record<string, string> = {};
        results.forEach(result => {
          data[result.stepName] = result.stdout;
        });
        setFetchedData(data);
        console.log('All data fetched successfully');
      }}
      onError={(errors) => {
        console.error(`${errors.length} requests failed`);
      }}
    />
  );
}

/**
 * Example 3: Parallel test execution
 */
export function ParallelTests() {
  return (
    <ShellParallel
      commands={[
        {
          name: 'unit-tests',
          classNames: 'jest--testPathPattern-unit',
          timeout: 60000,
        },
        {
          name: 'integration-tests',
          classNames: 'jest--testPathPattern-integration',
          timeout: 120000,
        },
        {
          name: 'e2e-tests',
          classNames: 'playwright-test',
          timeout: 300000,
        },
        {
          name: 'visual-tests',
          classNames: 'npm-run-test:visual',
          timeout: 180000,
        }
      ]}
      onComplete={(results) => {
        const summary = {
          total: results.length,
          passed: results.filter(r => r.exitCode === 0).length,
          failed: results.filter(r => r.exitCode !== 0).length,
          duration: Math.max(...results.map(r => r.duration))
        };

        console.log('\n=== Test Summary ===');
        console.log(`Total: ${summary.total}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Duration: ${summary.duration}ms`);

        results.forEach(result => {
          const status = result.exitCode === 0 ? '✓' : '✗';
          console.log(`${status} ${result.stepName} (${result.duration}ms)`);
        });
      }}
      verbose={true}
    />
  );
}

/**
 * Example 4: Conditional deployment based on environment
 */
export function ConditionalDeployment() {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <ShellConditional
      condition={() => isProduction}
      then={
        <ShellParallel
          commands={[
            'npm-run-deploy:web',
            'npm-run-deploy:api',
            'npm-run-deploy:worker'
          ]}
          onComplete={() => console.log('Production deployment complete')}
        />
      }
      else={
        <ShellParallel
          commands={[
            'npm-run-deploy:dev:web',
            'npm-run-deploy:dev:api'
          ]}
          onComplete={() => console.log('Development deployment complete')}
        />
      }
    />
  );
}

/**
 * Example 5: Loop over files and process in parallel
 */
export function ParallelFileProcessing() {
  const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];

  return (
    <ShellLoop
      items={files}
      command={(file) => `cat-${file}_pipe_wc--w`}
      parallel={true}
      onIteration={(result, file) => {
        const wordCount = result.stdout.trim();
        console.log(`${file}: ${wordCount} words`);
      }}
      onComplete={(results) => {
        const totalWords = results.reduce((sum, result) => {
          return sum + parseInt(result.stdout.trim() || '0', 10);
        }, 0);
        console.log(`Total words across all files: ${totalWords}`);
      }}
    />
  );
}

/**
 * Example 6: Parallel image optimization
 */
export function ParallelImageOptimization() {
  const [optimizedCount, setOptimizedCount] = useState(0);

  return (
    <ShellLoop
      items={['*.jpg', '*.png', '*.webp']}
      command={(pattern) => `find-images--name-${pattern}--exec-convert-{}-resize-50%-{}-;`}
      parallel={true}
      onIteration={(result, pattern) => {
        console.log(`Optimized ${pattern} images`);
        setOptimizedCount(prev => prev + 1);
      }}
      onComplete={(results) => {
        console.log(`Optimized ${results.length} image types`);
      }}
      stopOnError={false}
    />
  );
}

/**
 * Example 7: Sequential batch processing with conditional parallel execution
 */
export function SmartBatchProcessing() {
  const [smallFiles, setSmallFiles] = useState<string[]>([]);
  const [largeFiles, setLargeFiles] = useState<string[]>([]);

  return (
    <>
      {/* First, categorize files */}
      <ShellConditional
        condition={async () => {
          // Check file sizes and categorize
          const result = await fetch('/api/files/sizes');
          const data = await result.json();

          const small = data.filter((f: any) => f.size < 1024 * 1024); // < 1MB
          const large = data.filter((f: any) => f.size >= 1024 * 1024); // >= 1MB

          setSmallFiles(small.map((f: any) => f.name));
          setLargeFiles(large.map((f: any) => f.name));

          return true;
        }}
        then={
          <>
            {/* Process small files in parallel */}
            <ShellLoop
              items={smallFiles}
              command={(file) => `process-${file}`}
              parallel={true}
              onComplete={() => console.log('Small files processed')}
            />

            {/* Process large files sequentially */}
            <ShellLoop
              items={largeFiles}
              command={(file) => `process-large-${file}`}
              parallel={false}
              onComplete={() => console.log('Large files processed')}
            />
          </>
        }
      />
    </>
  );
}

/**
 * Example 8: Health checks across multiple services
 */
export function HealthCheckMonitor() {
  const services = ['api', 'database', 'cache', 'queue', 'storage'];

  return (
    <ShellLoop
      items={services}
      command={(service) => `curl-http://localhost:${getPort(service)}/health`}
      parallel={true}
      onIteration={(result, service, index) => {
        const isHealthy = result.exitCode === 0;
        console.log(`${service}: ${isHealthy ? '✓ Healthy' : '✗ Unhealthy'}`);
      }}
      onComplete={(results) => {
        const healthyCount = results.filter(r => r.exitCode === 0).length;
        console.log(`\nHealth Status: ${healthyCount}/${results.length} services healthy`);
      }}
      stopOnError={false}
    />
  );
}

function getPort(service: string): number {
  const ports: Record<string, number> = {
    api: 3000,
    database: 5432,
    cache: 6379,
    queue: 5672,
    storage: 9000
  };
  return ports[service] || 3000;
}

export default ParallelBuilds;
