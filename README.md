# Tailwindshell

**Execute shell commands in React with Tailwind CSS-inspired syntax**

[![npm version](https://img.shields.io/npm/v/tailwindshell.svg)](https://www.npmjs.com/package/tailwindshell)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

Tailwindshell brings the elegant, utility-first philosophy of Tailwind CSS to shell command execution in server-side React applications. Write commands using intuitive, dash-separated syntax that seamlessly integrates with your React components.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Syntax Reference](#syntax-reference)
- [Security](#security)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)

## Overview

Tailwindshell transforms traditional shell commands into React-friendly syntax:

```tsx
// Traditional approach
exec('ls -la /home', callback);

// Tailwindshell approach
<Shell classNames="ls--la-/home" />
```

### Why Tailwindshell?

- **Intuitive Syntax**: Leverage familiar Tailwind-style class names for shell commands
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Secure by Default**: Built-in security policies and command validation
- **React Native**: Seamlessly integrates with server-side React components
- **Feature-Rich**: Support for piping, conditionals, loops, and variables
- **Enterprise Ready**: Production-tested with comprehensive error handling

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
<Shell classNames="echo-Hello-World" />

// List files with flags
<Shell classNames="ls--la-/home" />

// Search with grep
<Shell classNames="grep--color-auto-error-app.log" />
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
      classNames="node--version"
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
| `npm-install` | `npm install` |

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
<Shell classNames="cat-file.txt_pipe_grep--color-error" />
```

## Syntax Reference

### Basic Commands

```tsx
// No arguments
<Shell classNames="pwd" />

// Single argument
<Shell classNames="cat-file.txt" />

// Multiple arguments
<Shell classNames="cp-source.txt-dest.txt" />
```

### Flags

```tsx
// Short flag
<Shell classNames="ls--l" />

// Multiple short flags
<Shell classNames="ls--la" />

// Long flag
<Shell classNames="grep--color-red" />

// Flag with value
<Shell classNames="grep--color-auto-error" />
```

### File Paths

```tsx
// Absolute path (dashes become slashes)
<Shell classNames="cat-/home/user/file.txt" />

// Relative path
<Shell classNames="cat-./data/file.txt" />

// Current directory
<Shell classNames="ls-." />
```

### Command Chaining

#### Pipe (`|`)

```tsx
<Shell classNames="cat-file.txt_pipe_grep-error_pipe_wc--l" />
// Executes: cat file.txt | grep error | wc -l
```

#### And (`&&`)

```tsx
<Shell classNames="mkdir-test_and_cd-test_and_ls" />
// Executes: mkdir test && cd test && ls
```

#### Or (`||`)

```tsx
<Shell classNames="test--f-file.txt_or_echo-not-found" />
// Executes: test -f file.txt || echo not-found
```

#### Sequential (`;`)

```tsx
<Shell classNames="echo-first_then_echo-second" />
// Executes: echo first ; echo second
```

#### Background (`&`)

```tsx
<Shell classNames="sleep-10_bg_echo-done" />
// Executes: sleep 10 & echo done
```

## Security

Tailwindshell implements multiple layers of security to protect your application:

### Default Security Policy

```tsx
{
  blockedCommands: ['rm', 'dd', 'mkfs', 'shutdown', 'reboot'],
  blockedPaths: ['/etc', '/sys', '/proc', '/dev', '/boot'],
  maxExecutionTime: 30000, // 30 seconds
  allowPiping: true,
  allowRedirection: false
}
```

### Custom Security Policy

```tsx
<Shell
  classNames="cat-/app/data/file.txt"
  securityPolicy={{
    allowedCommands: ['cat', 'ls', 'grep'],
    allowedPaths: ['/app/data'],
    maxExecutionTime: 10000,
  }}
/>
```

### Sudo Execution

```tsx
<Shell
  classNames="systemctl-restart-nginx"
  sudo={true}
  securityPolicy={{
    requireSudo: true,
    allowedCommands: ['systemctl'],
  }}
/>
```

### Dry Run Mode

Test commands without execution:

```tsx
<Shell
  classNames="rm--rf-important-data"
  dryRun={true}
  onComplete={(result) => {
    console.log('Would execute:', result.command);
  }}
/>
```

## Advanced Features

### Conditionals

Execute commands based on conditions:

```tsx
import { parseConditional, conditionalToShell } from 'tailwindshell';

// If file exists, cat it; otherwise, echo not found
<Shell classNames="if-test--f-file.txt_then_cat-file.txt_else_echo-not-found" />
```

### Loops

#### For Loops

```tsx
import { parseLoop, loopToShell } from 'tailwindshell';

// Process multiple files
<Shell classNames="for-file-in-*.txt-*.log_do_cat-$file" />
```

#### While Loops

```tsx
// Wait for file to exist
<Shell classNames="while-test-!--f-ready.txt_do_sleep-1" />
```

### Variables

```tsx
import { VariableStore } from 'tailwindshell';

const variables = new VariableStore();
variables.set('PROJECT_DIR', '/home/user/projects');

// Use variables in commands
const command = variables.substitute('cd-$PROJECT_DIR_and_ls');
<Shell classNames={command} />
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

## API Reference

### Shell Component

```tsx
interface ShellProps {
  classNames: string;           // Command in Tailwind-style syntax
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
      classNames="cat-/var/log/app.log_pipe_grep-ERROR_pipe_wc--l"
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
        classNames="npm-run-build"
        onComplete={() => console.log('Build complete')}
      />
      <Shell
        classNames="npm-run-test"
        onComplete={() => console.log('Tests passed')}
      />
      <Shell
        classNames="rsync--av-build/-user@server:/var/www/"
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
        classNames="df--h"
        onComplete={(result) => {
          setStats((prev) => ({ ...prev, disk: result.stdout }));
        }}
      />
      <Shell
        classNames="free--h"
        onComplete={(result) => {
          setStats((prev) => ({ ...prev, memory: result.stdout }));
        }}
      />
      <Shell
        classNames="uptime"
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
      classNames="if-npm-test_then_npm-run-deploy_else_echo-Tests-failed"
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
      classNames="for-file-in-/data/*.csv_do_node-process.js-$file"
      verbose={true}
      timeout={300000} // 5 minutes
      onComplete={(result) => {
        console.log('All files processed');
      }}
    />
  );
}
```

## Best Practices

### 1. Always Use Security Policies

```tsx
// Good: Explicit security policy
<Shell
  classNames="cat-user-data.txt"
  securityPolicy={{
    allowedCommands: ['cat'],
    allowedPaths: ['/app/data'],
  }}
/>

// Avoid: No security restrictions
<Shell classNames="cat-user-data.txt" />
```

### 2. Handle Errors Gracefully

```tsx
<Shell
  classNames="risky-command"
  onError={(error) => {
    logError(error);
    notifyAdmin(error);
    showUserFriendlyMessage();
  }}
/>
```

### 3. Use Dry Run for Testing

```tsx
// Test commands before production
<Shell
  classNames="complex-command"
  dryRun={process.env.NODE_ENV !== 'production'}
/>
```

### 4. Set Appropriate Timeouts

```tsx
// Short timeout for quick commands
<Shell classNames="ls" timeout={5000} />

// Longer timeout for build processes
<Shell classNames="npm-run-build" timeout={600000} />
```

### 5. Validate Input

```tsx
function SafeFileReader({ filename }: { filename: string }) {
  // Validate filename
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  return <Shell classNames={`cat-${filename}`} />;
}
```

### 6. Use Environment Variables

```tsx
<Shell
  classNames="deploy-script.sh"
  env={{
    NODE_ENV: 'production',
    API_KEY: process.env.API_KEY,
  }}
/>
```

### 7. Enable Verbose Logging in Development

```tsx
<Shell
  classNames="debug-command"
  verbose={process.env.NODE_ENV === 'development'}
/>
```

## Performance Considerations

### Command Execution

- Commands execute asynchronously and don't block the React render
- Use `timeout` to prevent long-running commands
- Consider rate limiting for user-triggered commands

### Memory Management

- Large outputs are automatically truncated
- Use streaming for commands with significant output
- Clean up event listeners in component cleanup

### Caching

```tsx
// Cache command results
const [cachedResult, setCachedResult] = useState(null);

<Shell
  classNames="expensive-command"
  onComplete={(result) => {
    setCachedResult(result);
    localStorage.setItem('cache-key', JSON.stringify(result));
  }}
/>
```

## Troubleshooting

### Common Issues

#### Command Not Found

```tsx
// Ensure command is in PATH
<Shell
  classNames="custom-command"
  env={{ PATH: process.env.PATH + ':/custom/bin' }}
/>
```

#### Permission Denied

```tsx
// Use sudo or adjust file permissions
<Shell classNames="privileged-command" sudo={true} />
```

#### Timeout Errors

```tsx
// Increase timeout for long-running commands
<Shell classNames="long-command" timeout={300000} />
```

### Debug Mode

```tsx
<Shell
  classNames="problematic-command"
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
  classNames: 'ls--la',
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
npm install
npm run dev
```

### Running Tests

```bash
npm test
npm run test:coverage
```

### Code Quality

```bash
npm run lint
npm run format
npm run type-check
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

**Note**: Tailwindshell is designed for server-side React applications. Never execute user-provided commands without proper validation and security measures.
