

# Tailwindshell Workflow Examples

This directory contains comprehensive examples of using Tailwindshell's workflow components to orchestrate complex command execution patterns.

## Components

### ShellPipeline

Execute commands sequentially, passing output from one command as input to the next (like Unix pipes).

**Use cases:**
- Data processing pipelines
- Build and deployment sequences
- Log analysis workflows
- Text transformation chains

**Example:**
```tsx
<ShellPipeline
  steps={[
    'cat-file.txt',
    'grep-error',
    'wc--l'
  ]}
  onComplete={(results) => console.log('Done')}
/>
```

### ShellWorkflow

Advanced workflow execution with conditional steps, named steps, and flexible control flow.

**Use cases:**
- CI/CD pipelines with conditional stages
- Complex multi-step processes
- Workflows with dynamic branching
- Error recovery workflows

**Example:**
```tsx
<ShellWorkflow
  steps={[
    {
      name: 'build',
      classNames: 'npm-run-build'
    },
    {
      name: 'test',
      classNames: 'npm-test',
      condition: (results) => results[0].exitCode === 0
    },
    {
      name: 'deploy',
      classNames: 'npm-run-deploy',
      condition: (results) => results.every(r => r.exitCode === 0)
    }
  ]}
  onComplete={(results) => console.log('Workflow done')}
/>
```

### ShellParallel

Execute multiple independent commands simultaneously.

**Use cases:**
- Parallel test execution
- Concurrent builds
- Simultaneous API calls
- Independent task processing

**Example:**
```tsx
<ShellParallel
  commands={[
    'npm-run-test:unit',
    'npm-run-test:integration',
    'npm-run-test:e2e'
  ]}
  onComplete={(results) => console.log('All tests done')}
/>
```

### ShellConditional

Execute commands based on runtime conditions.

**Use cases:**
- Environment-based execution
- Feature flag-driven workflows
- Conditional deployments
- Dynamic workflow branching

**Example:**
```tsx
<ShellConditional
  condition={() => process.env.NODE_ENV === 'production'}
  then={<Shell classNames="npm-run-deploy:prod" />}
  else={<Shell classNames="npm-run-deploy:dev" />}
/>
```

### ShellLoop

Loop over items and execute commands for each item.

**Use cases:**
- Batch file processing
- Data import/export
- Multi-environment deployments
- Iterative transformations

**Example:**
```tsx
<ShellLoop
  items={['file1.txt', 'file2.txt', 'file3.txt']}
  command={(file) => `cat-${file}_pipe_wc--l`}
  onComplete={(results) => console.log('All files processed')}
/>
```

## Common Patterns

### Pattern 1: Build → Test → Deploy Pipeline

```tsx
<ShellPipeline
  steps={[
    { name: 'build', classNames: 'npm-run-build' },
    { name: 'test', classNames: 'npm-test' },
    { name: 'deploy', classNames: 'npm-run-deploy', sudo: true }
  ]}
  stopOnError={true}
/>
```

### Pattern 2: Parallel Tests with Sequential Deployment

```tsx
<ShellWorkflow
  steps={[
    { name: 'unit', classNames: 'npm-run-test:unit' },
    { name: 'integration', classNames: 'npm-run-test:integration' },
    { name: 'e2e', classNames: 'npm-run-test:e2e' }
  ]}
  parallel={true}
  onComplete={(results) => {
    if (results.every(r => r.exitCode === 0)) {
      // All tests passed, deploy
      return <Shell classNames="npm-run-deploy" />;
    }
  }}
/>
```

### Pattern 3: Conditional Multi-Environment Deployment

```tsx
<ShellConditional
  condition={async () => await checkStagingHealth()}
  then={
    <ShellPipeline
      steps={[
        'npm-run-deploy:staging',
        'npm-run-test:smoke',
        'npm-run-deploy:production'
      ]}
    />
  }
  else={
    <Shell classNames="echo-Staging-health-check-failed" />
  }
/>
```

### Pattern 4: Batch Processing with Progress Tracking

```tsx
<ShellLoop
  items={files}
  command={(file, index) => `process-${file}`}
  parallel={true}
  onIteration={(result, file, index) => {
    console.log(`Processed ${index + 1}/${files.length}: ${file}`);
  }}
/>
```

### Pattern 5: Data Processing Pipeline with Transformation

```tsx
<ShellPipeline
  steps={[
    { name: 'extract', classNames: 'cat-data.csv' },
    {
      name: 'transform',
      classNames: 'jq-.data[]',
      transform: (input) => JSON.parse(input)
    },
    { name: 'load', classNames: 'psql-db-import' }
  ]}
/>
```

## Advanced Workflows

### Error Recovery Workflow

```tsx
<ShellWorkflow
  steps={[
    { name: 'main-task', classNames: 'risky-command' },
    {
      name: 'fallback',
      classNames: 'safe-command',
      condition: (results) => results[0]?.exitCode !== 0
    }
  ]}
  stopOnError={false}
/>
```

### Multi-Stage CI/CD

```tsx
<ShellWorkflow
  steps={[
    // Stage 1: Code Quality (parallel)
    { name: 'lint', classNames: 'npm-run-lint' },
    { name: 'format', classNames: 'npm-run-format:check' },
    { name: 'type-check', classNames: 'npm-run-type-check' },

    // Stage 2: Build (sequential)
    {
      name: 'build',
      classNames: 'npm-run-build',
      condition: (results) => results.slice(0, 3).every(r => r.exitCode === 0)
    },

    // Stage 3: Tests (parallel)
    { name: 'test:unit', classNames: 'npm-run-test:unit' },
    { name: 'test:integration', classNames: 'npm-run-test:integration' },

    // Stage 4: Deploy (conditional)
    {
      name: 'deploy',
      classNames: 'npm-run-deploy',
      condition: (results) => results.every(r => r.exitCode === 0),
      sudo: true
    }
  ]}
  onStepComplete={(result) => {
    console.log(`✓ ${result.stepName} (${result.duration}ms)`);
  }}
/>
```

## Best Practices

1. **Use ShellPipeline** when commands need to pass data to each other sequentially
2. **Use ShellWorkflow** when you need complex conditional logic and named steps
3. **Use ShellParallel** when commands are independent and can run simultaneously
4. **Use ShellConditional** for runtime branching based on dynamic conditions
5. **Use ShellLoop** for batch processing and iterative tasks

### Performance Tips

- Use `parallel={true}` for independent tasks to maximize throughput
- Set appropriate `timeout` values for long-running commands
- Use `stopOnError={false}` when you want to continue despite failures
- Leverage `transform` functions to process data between steps

### Security Tips

- Always set `securityPolicy` for production workflows
- Use `dryRun={true}` to test workflows without executing
- Validate user input before passing to commands
- Use environment variables for sensitive data

### Monitoring Tips

- Enable `verbose={true}` during development
- Use `onStepComplete` for progress tracking
- Implement proper error handling with `onError`
- Log workflow metrics for performance analysis

## Examples Directory

- `pipeline-example.tsx` - ShellPipeline examples
- `workflow-example.tsx` - ShellWorkflow examples
- `parallel-example.tsx` - ShellParallel, ShellConditional, ShellLoop examples

## Running Examples

```bash
# Install dependencies
npm install

# Run example
npm run example examples/workflows/pipeline-example.tsx
```

## Contributing

Feel free to contribute more workflow examples! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
