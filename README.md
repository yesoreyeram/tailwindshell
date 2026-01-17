# Tailwindshell 🎉

**Execute shell commands in React with Tailwind CSS-inspired syntax**

[![npm version](https://img.shields.io/npm/v/tailwindshell.svg)](https://www.npmjs.com/package/tailwindshell)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Fun Level](https://img.shields.io/badge/Fun%20Level-💯-brightgreen)](https://github.com/yesoreyeram/tailwindshell)

> ⚠️ **FOR FUN AND EXPERIMENTATION ONLY!** ⚠️
> 
> This is a playful, experimental project for learning and having fun! 🎈
> **NOT FOR PRODUCTION USE!** Use at your own risk! 💥
> 
> No security, no validation, no limits - just pure, unadulterated command execution chaos! 🔥

Tailwindshell brings the elegant, utility-first philosophy of Tailwind CSS to shell command execution in server-side React applications. Write commands using intuitive, dash-separated syntax that seamlessly integrates with your React components.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Syntax Reference](#syntax-reference)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Overview

Tailwindshell transforms traditional shell commands into React-friendly syntax:

```tsx
// Traditional approach
exec('ls -la /home', callback);

// Tailwindshell approach
<Shell className="ls--la-/home" />
```

### Why Tailwindshell?

- **Intuitive Syntax**: Leverage familiar Tailwind-style class names for shell commands
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **No Limits**: Execute anything! No security restrictions! 🎢
- **React Native**: Seamlessly integrates with server-side React components
- **Feature-Rich**: Support for piping, conditionals, loops, and variables
- **Experimental Fun**: Perfect for learning, hacking, and exploring! 🚀

## Installation

```bash
npm install tailwindshell
```

```bash
yarn add tailwindshell
```

```bash
pnpm add tailwindshell
```

### Requirements

- Node.js >= 18.0.0
- React >= 18.0.0
- TypeScript >= 5.0 (for TypeScript projects)

## Quick Start

### Basic Usage

```tsx
import { Shell } from 'tailwindshell';

// Simple command
<Shell className="echo-Hello-World" />

// List files with flags
<Shell className="ls--la-/home" />

// Search with grep
<Shell className="grep--color-auto-error-app.log" />
```

### With Callbacks

```tsx
import { Shell } from 'tailwindshell';

function MyComponent() {
  const handleComplete = (result) => {
    console.log('Output:', result.stdout);
    console.log('Exit code:', result.exitCode);
  };

  const handleError = (error) => {
    console.error('Command failed:', error.message);
  };

  return (
    <Shell
      className="node--version"
      onComplete={handleComplete}
      onError={handleError}
    />
  );
}
```

## Core Concepts

### Syntax Conversion

Tailwindshell converts dash-separated class names into shell commands:

| Tailwind Style | Shell Command |
|---------------|---------------|
| `ls--la-/home` | `ls -la /home` |
| `cat-file.txt` | `cat file.txt` |
| `grep--color-auto-error-app.log` | `grep --color auto error app.log` |
| `npm-install` | `yarn add` |

### Command Components

A Tailwindshell command consists of:

1. **Command**: The base command (e.g., `ls`, `cat`, `grep`)
2. **Flags**: Short (`-l`) or long (`--la`) flags prefixed with dashes
3. **Arguments**: File paths, strings, or other parameters
4. **Operators**: Chain commands with `_pipe_`, `_and_`, `_or_`

```tsx
// Command: cat
// Argument: file.txt
// Operator: pipe
// Next command: grep with flag and argument
<Shell className="cat-file.txt_pipe_grep--color-error" />
```

## Syntax Reference

### Basic Commands

```tsx
// No arguments
<Shell className="pwd" />

// Single argument
<Shell className="cat-file.txt" />

// Multiple arguments
<Shell className="cp-source.txt-dest.txt" />
```

### Flags

```tsx
// Short flag
<Shell className="ls--l" />

// Multiple short flags
<Shell className="ls--la" />

// Long flag
<Shell className="grep--color-red" />

// Flag with value
<Shell className="grep--color-auto-error" />
```

### File Paths

```tsx
// Absolute path (dashes become slashes)
<Shell className="cat-/home/user/file.txt" />

// Relative path
<Shell className="cat-./data/file.txt" />

// Current directory
<Shell className="ls-." />
```

### Command Chaining

#### Pipe (`|`)

```tsx
<Shell className="cat-file.txt_pipe_grep-error_pipe_wc--l" />
// Executes: cat file.txt | grep error | wc -l
```

#### And (`&&`)

```tsx
<Shell className="mkdir-test_and_cd-test_and_ls" />
// Executes: mkdir test && cd test && ls
```

#### Or (`||`)

```tsx
<Shell className="test--f-file.txt_or_echo-not-found" />
// Executes: test -f file.txt || echo not-found
```

#### Sequential (`;`)

```tsx
<Shell className="echo-first_then_echo-second" />
// Executes: echo first ; echo second
```

#### Background (`&`)

```tsx
<Shell className="sleep-10_bg_echo-done" />
// Executes: sleep 10 & echo done
```

## Advanced Features

### Conditionals

Execute commands based on conditions:

```tsx
import { parseConditional, conditionalToShell } from 'tailwindshell';

// If file exists, cat it; otherwise, echo not found
<Shell className="if-test--f-file.txt_then_cat-file.txt_else_echo-not-found" />
```

### Loops

#### For Loops

```tsx
import { parseLoop, loopToShell } from 'tailwindshell';

// Process multiple files
<Shell className="for-file-in-*.txt-*.log_do_cat-$file" />
```

#### While Loops

```tsx
// Wait for file to exist
<Shell className="while-test-!--f-ready.txt_do_sleep-1" />
```

### Variables

```tsx
import { VariableStore } from 'tailwindshell';

const variables = new VariableStore();
variables.set('PROJECT_DIR', '/home/user/projects');

// Use variables in commands
const command = variables.substitute('cd-$PROJECT_DIR_and_ls');
<Shell className={command} />
```

### Streaming Output

```tsx
import { CommandExecutor } from 'tailwindshell';

const executor = new CommandExecutor();
const parsed = parse('npm-install');

await executor.executeStream(parsed, (data, type) => {
  if (type === 'stdout') {
    console.log('Output:', data);
  } else {
    console.error('Error:', data);
  }
});
```

### Workflow Components

Tailwindshell provides powerful workflow components for orchestrating complex command execution patterns.

#### ShellPipeline - Sequential Execution

Execute commands in sequence, passing output from one to the next:

```tsx
import { ShellPipeline } from 'tailwindshell';

<ShellPipeline
  steps={[
    'cat-file.txt',
    'grep-error',
    'wc--l'
  ]}
  onComplete={(results) => {
    console.log('Pipeline complete:', results);
  }}
/>
```

#### ShellWorkflow - Complex Workflows

Advanced workflow with conditional steps and named stages:

```tsx
import { ShellWorkflow } from 'tailwindshell';

<ShellWorkflow
  steps={[
    {
      name: 'build',
      className: 'npm-run-build'
    },
    {
      name: 'test',
      className: 'npm-test',
      condition: (results) => results[0].exitCode === 0
    },
    {
      name: 'deploy',
      className: 'npm-run-deploy',
      condition: (results) => results.every(r => r.exitCode === 0),
      sudo: true
    }
  ]}
  onComplete={(results) => console.log('Workflow done')}
/>
```

#### ShellParallel - Parallel Execution

Run multiple commands simultaneously:

```tsx
import { ShellParallel } from 'tailwindshell';

<ShellParallel
  commands={[
    'npm-run-test:unit',
    'npm-run-test:integration',
    'npm-run-test:e2e'
  ]}
  onComplete={(results) => {
    const allPassed = results.every(r => r.exitCode === 0);
    console.log(allPassed ? 'All tests passed!' : 'Some tests failed');
  }}
/>
```

#### ShellConditional - Conditional Execution

Execute commands based on runtime conditions:

```tsx
import { ShellConditional } from 'tailwindshell';

<ShellConditional
  condition={() => process.env.NODE_ENV === 'production'}
  then={<Shell className="npm-run-deploy:prod" />}
  else={<Shell className="npm-run-deploy:dev" />}
/>
```

#### ShellLoop - Batch Processing

Loop over items and execute commands:

```tsx
import { ShellLoop } from 'tailwindshell';

<ShellLoop
  items={['file1.txt', 'file2.txt', 'file3.txt']}
  command={(file) => `cat-${file}_pipe_wc--l`}
  parallel={true}
  onIteration={(result, file) => {
    console.log(`${file}: ${result.stdout.trim()} lines`);
  }}
/>
```

#### IF, ElseIf, Else - Declarative Conditionals

Use declarative conditional rendering with chained conditions.

**Command-based conditions** (exit code 0 = true):

```tsx
import { IF, ElseIf, Else } from 'tailwindshell';

// Use Tailwind-style commands as conditions
<IF className="test--f-production.env">
  <Shell className="npm-run-deploy:prod" sudo={true} />

  <ElseIf className="test--f-staging.env">
    <Shell className="npm-run-deploy:staging" />
  </ElseIf>

  <ElseIf className="test--f-qa.env">
    <Shell className="npm-run-deploy:qa" />
  </ElseIf>

  <Else>
    <Shell className="npm-run-deploy:dev" />
  </Else>
</IF>
```

**Boolean/function conditions**:

```tsx
<IF condition={process.env.NODE_ENV === 'production'}>
  <Shell className="npm-run-deploy:prod" sudo={true} />
  <Else>
    <Shell className="npm-run-deploy:dev" />
  </Else>
</IF>
```

**Async conditions**:

```tsx
<IF condition={async () => await checkFileExists('data.csv')}>
  <ShellPipeline steps={['cat-data.csv', 'process']} />
  <Else>
    <Shell className="echo-File-not-found" />
  </Else>
</IF>
```

#### Passing Output Between Commands

The `Shell` component supports `stdin` to pass data from one command to another:

```tsx
const [output, setOutput] = useState('');

// First command
<Shell
  className="cat-data.txt"
  onComplete={(result) => setOutput(result.stdout)}
/>

// Second command uses first command's output
<Shell
  className="grep-error"
  stdin={output}
  onComplete={(result) => console.log('Filtered:', result.stdout)}
/>
```

For more workflow examples, see [examples/workflows/](examples/workflows/).

## API Reference

### Shell Component

```tsx
interface ShellProps {
  className: string;            // Command in Tailwind-style syntax
  sudo?: boolean;               // Execute with sudo
  cwd?: string;                 // Working directory
  env?: Record<string, string>; // Environment variables
  onComplete?: (result: CommandResult) => void;
  onError?: (error: Error) => void;
  securityPolicy?: SecurityPolicy;
  timeout?: number;             // Timeout in milliseconds
  dryRun?: boolean;             // Parse without executing
  verbose?: boolean;            // Enable logging
}
```

### CommandResult

```tsx
interface CommandResult {
  stdout: string;    // Standard output
  stderr: string;    // Standard error
  exitCode: number;  // Exit code
  command: string;   // Executed command
  duration: number;  // Execution time in ms
}
```

### Security Policy

```tsx
interface SecurityPolicy {
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowedPaths?: string[];
  blockedPaths?: string[];
  requireSudo?: boolean;
  maxExecutionTime?: number;
  allowPiping?: boolean;
  allowRedirection?: boolean;
}
```

### Parser Functions

```tsx
// Parse Tailwind-style command
const parsed = parse('ls--la-/home');

// Convert back to shell command
const shellCmd = toShellCommand(parsed);
```

### Executor Functions

```tsx
// Execute command directly
const result = await execute('ls--la', { cwd: '/home' });

// Create executor instance
const executor = new CommandExecutor({ timeout: 5000 });
await executor.execute(parsed);
```

## Examples

### Example 1: File Processing Pipeline

```tsx
import { Shell } from 'tailwindshell';

function LogAnalyzer() {
  return (
    <Shell
      className="cat-/var/log/app.log_pipe_grep-ERROR_pipe_wc--l"
      onComplete={(result) => {
        console.log(`Found ${result.stdout.trim()} errors`);
      }}
    />
  );
}
```

### Example 2: Build and Deploy

```tsx
function DeployApp() {
  return (
    <>
      <Shell
        className="npm-run-build"
        onComplete={() => console.log('Build complete')}
      />
      <Shell
        className="npm-run-test"
        onComplete={() => console.log('Tests passed')}
      />
      <Shell
        className="rsync--av-build/-user@server:/var/www/"
        sudo={true}
        onComplete={() => console.log('Deployed successfully')}
      />
    </>
  );
}
```

### Example 3: System Monitoring

```tsx
function SystemMonitor() {
  const [stats, setStats] = useState({});

  return (
    <>
      <Shell
        className="df--h"
        onComplete={(result) => {
          setStats((prev) => ({ ...prev, disk: result.stdout }));
        }}
      />
      <Shell
        className="free--h"
        onComplete={(result) => {
          setStats((prev) => ({ ...prev, memory: result.stdout }));
        }}
      />
      <Shell
        className="uptime"
        onComplete={(result) => {
          setStats((prev) => ({ ...prev, uptime: result.stdout }));
        }}
      />
    </>
  );
}
```

### Example 4: Conditional Deployment

```tsx
function ConditionalDeploy() {
  return (
    <Shell
      className="if-npm-test_then_npm-run-deploy_else_echo-Tests-failed"
      onComplete={(result) => {
        if (result.exitCode === 0) {
          console.log('Deployment successful');
        } else {
          console.error('Deployment failed');
        }
      }}
    />
  );
}
```

### Example 5: Batch File Processing

```tsx
function BatchProcessor() {
  return (
    <Shell
      className="for-file-in-/data/*.csv_do_node-process.js-$file"
      verbose={true}
      timeout={300000} // 5 minutes
      onComplete={(result) => {
        console.log('All files processed');
      }}
    />
  );
}
```

## Fun Tips & Tricks 🎪

### 1. Go Wild with Commands! 🤠

```tsx
// YOLO! No restrictions!
<Shell className="rm--rf-/" /> // Please don't actually do this 😅

// Want to format your disk? Go ahead! (Again, please don't!)
<Shell className="dd-if=/dev/zero-of=/dev/sda" />

// The world is your oyster! 🦪
<Shell className="chmod-777-/" />
```

### 2. Infinite Loops? Sure! ⭕

```tsx
// No timeout by default - let it run forever!
<Shell className="while-true_do_echo-wheee!" />
```

### 3. Embrace the Chaos 🎲

```tsx
<Shell
  className="cat-/dev/urandom"
  onComplete={(result) => {
    console.log('Random data goes brrrr! 📊');
  }}
/>
```

### 4. Verbose Mode Shows Fun Warnings 🎉

```tsx
<Shell
  className="rm--rf-important-stuff"
  verbose={true}
  onComplete={(result) => {
    console.log('Did you really mean to do that? 😱');
  }}
/>
```

### 5. Experiment and Learn! 🧪

```tsx
// This is a learning tool - try things!
// Break things! Learn from mistakes!
// Just maybe not on your main system... 🙃
<Shell
  className="your-crazy-command-here"
  onError={(error) => {
    console.log('Oops! That was fun! 💥');
  }}
/>
```

## Important Disclaimers ⚠️

**SERIOUSLY THOUGH:**

- 🚫 **DO NOT USE IN PRODUCTION**
- 🚫 **DO NOT RUN ON IMPORTANT SYSTEMS**
- 🚫 **DO NOT EXECUTE UNTRUSTED USER INPUT**
- 🚫 **DO NOT BLAME US IF THINGS GO WRONG**

This is a **toy project** for:
- Learning how shell commands work
- Experimenting with React and TypeScript
- Having fun with command execution
- Understanding why security matters (by removing it!)

Use a **virtual machine**, **Docker container**, or **disposable environment** for testing!

## Troubleshooting

### Common Issues

#### Command Not Found

```tsx
// Ensure command is in PATH
<Shell
  className="custom-command"
  env={{ PATH: process.env.PATH + ':/custom/bin' }}
/>
```

#### Permission Denied

```tsx
// Use sudo or adjust file permissions
<Shell className="privileged-command" sudo={true} />
```

#### Timeout Errors

```tsx
// Increase timeout for long-running commands
<Shell className="long-command" timeout={300000} />
```

### Debug Mode

```tsx
<Shell
  className="problematic-command"
  verbose={true}
  dryRun={true}
  onComplete={(result) => {
    console.log('Command:', result.command);
    console.log('Would execute:', result.stdout);
  }}
/>
```

## TypeScript Support

Tailwindshell is written in TypeScript and provides comprehensive type definitions:

```tsx
import type {
  ShellProps,
  CommandResult,
  SecurityPolicy,
  ParsedCommand,
} from 'tailwindshell';

const props: ShellProps = {
  className: 'ls--la',
  onComplete: (result: CommandResult) => {
    console.log(result.stdout);
  },
};
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/yourusername/tailwindshell.git
cd tailwindshell
yarn install
yarn dev
```

### Running Tests

```bash
yarn test
yarn test:coverage
```

### Code Quality

```bash
yarn lint
yarn format
yarn type-check
```

## License

MIT © [Your Name]

## Acknowledgments

- Inspired by [Tailwind CSS](https://tailwindcss.com/)
- Built with [TypeScript](https://www.typescriptlang.org/)
- Powered by [React](https://react.dev/)

## Support

- [Documentation](https://tailwindshell.dev)
- [GitHub Issues](https://github.com/yourusername/tailwindshell/issues)
- [Discord Community](https://discord.gg/tailwindshell)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tailwindshell)

---

**Remember**: This is a FUN, EXPERIMENTAL project! 🎉 Not for production! Use responsibly (or irresponsibly, we're not the boss of you)! 😎

Made with ❤️ (and a complete disregard for security best practices) for learning and fun!
