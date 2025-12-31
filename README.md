# Tailwindshell

Server-first, declarative shell execution using Tailwind-like utility class names. Tailwindshell lets you describe server-side shell commands directly in React server components without sprinkling imperative scripts throughout your codebase.

> **Serious note**: Tailwindshell is not satire. Treat it as infrastructure-grade software and apply your organization’s governance, security, and change-management practices.

## Table of Contents

1. [What is Tailwindshell?](#what-is-tailwindshell)
2. [Key Capabilities](#key-capabilities)
3. [Installation](#installation)
4. [Quick Start](#quick-start)
5. [Command Syntax](#command-syntax)
6. [Usage Patterns](#usage-patterns)
7. [Advanced Composition](#advanced-composition)
8. [Configuration & Props](#configuration--props)
9. [Security & Compliance](#security--compliance)
10. [Operational Guidance](#operational-guidance)
11. [FAQ](#faq)

## What is Tailwindshell?

Tailwindshell encodes shell operations as utility-like class names. Instead of writing imperative scripts, you declare the command you want to run and Tailwindshell executes it on the server as part of your React rendering pipeline. This approach keeps infrastructure tasks versioned alongside UI code and auditable through standard code review.

## Key Capabilities

- **Declarative commands**: Express shell tasks through predictable, composable class-name syntax.
- **Server-side execution**: Commands run only on the server—never shipped to the client.
- **Chaining & piping**: Concatenate commands, pipe output, and reuse results.
- **Policy-aware**: Supports sudo, working-directory scoping, timeouts, and environment injection.
- **Audit-friendly**: Commands live in code review, enabling approvals and automated governance.

## Installation

Tailwindshell is distributed as an npm package.

```bash
npm install tailwindshell
# or
yarn add tailwindshell
# or
pnpm add tailwindshell
```

> Ensure your runtime supports React Server Components and that the server environment has the required binaries available (e.g., `bash`, `sh`, or target tools like `git`, `tar`, `jq`).

## Quick Start

```tsx
'use server';

import Shell from "tailwindshell";

export default function App() {
  return (
    <>
      {/* Read system information */}
      <Shell classNames="cat-/etc/os-release" />

      {/* Restart a service with elevated privileges */}
      <Shell classNames="systemctl-restart-nginx" sudo />
    </>
  );
}
```

## Command Syntax

Tailwindshell uses a predictable mapping from class names to shell tokens. Hyphens (`-`) delimit tokens; double hyphens (`--`) represent literal hyphens inside tokens. Examples assume `classNames` is a whitespace-separated list of command segments.

### Basics

- `echo-hello` → `echo "hello"`
- `cat-/var/log/syslog` → `cat /var/log/syslog`
- `ls--la-/opt/apps` → `ls -la /opt/apps` (double hyphen to emit `-la`)

### Multiple commands

Whitespace separates commands to run sequentially in a single invocation:

```
"echo-start && mkdir-/tmp/report && touch-/tmp/report/index.html"
```

### Piping

Use `pipe` between commands to create shell pipelines:

- `cat-/var/log/auth.log pipe grep-ERROR pipe tail--n-20`
  - Expands to: `cat /var/log/auth.log | grep ERROR | tail -n 20`

### Redirection

- `echo-hello-planet redirect->>-./planet.log`
  - Appends to `./planet.log`
- `journalctl--u-sshd redirect->-./sshd.log`

### Environment variables

Prefix with `env-VAR=value` to inject environment variables for the command scope:

```
"env-NODE_ENV=production env-API_HOST=internal.example.com curl-https://$API_HOST/health"
```

### Working directory

Use `cwd-/path/to/dir` to change directory before executing:

```
"cwd-/var/www npm-run-build"
```

### Sudo

Add the `sudo` prop to run the entire command set with elevated privileges:

```tsx
<Shell classNames="systemctl-restart-nginx" sudo />
```

### Timeouts

Use `timeout-30s` (or `timeout-2m`) to bound execution:

```
"timeout-30s curl-https://status.example.com"
```

### Looping & branching (declarative patterns)

While Tailwindshell ultimately translates to shell, you can encode simple control flows:

- **For-each style**: `for-hosts=web1,web2,web3 do-echo-{} done`
  - Expands conceptually to iterating hostnames.
- **Conditional**: `if-test--f-/etc/ssl/cert.pem then-echo-ready else-echo-missing fi`
  - Represents a guard pattern.

These patterns are documented for teams standardizing class conventions; actual expansion depends on your execution adapter.

## Usage Patterns

### Routine operations

- Health check: `curl--fsSL-https://status.example.com`
- Disk usage: `df--h`  
- Log tailing: `tail--n-50-/var/log/nginx/access.log`

### Multi-step workflows

```tsx
<Shell
  classNames={[
    "echo-starting-deploy",
    "cwd-/srv/app git-pull-origin-main",
    "npm-ci",
    "npm-run-build",
    "systemctl-restart-app",
    "echo-complete"
  ].join(' && ')}
/>;
```

### Data processing with pipes

```
"curl--s-https://api.example.com/users pipe jq-.data[]|.id pipe sort | uniq"
```

### Artifact management

- Package logs: `tar--czf-/tmp/logs.tgz-/var/log/app`
- Verify checksum: `sha256sum-/tmp/logs.tgz`

### Database & cloud CLIs

- Postgres backup: `pg_dump--Fc-mydb redirect->-/backups/mydb.dump`
- AWS example: `aws-s3-ls-s3://my-bucket`

## Advanced Composition

- **Parameterized tokens**: Use braces `{}` as placeholders in your team conventions (e.g., `echo-{BUILD_ID}`) and replace them during rendering.
- **Inline scripts**: `bash--lc-"for i in $(seq 1 3); do echo-$i; done"`
- **Parallelization hint**: Combine multiple `<Shell>` components to fan out independent tasks.
- **Idempotency**: Compose guard clauses—`if-test--d-/data/app then-echo-skip else-mkdir-/data/app fi`.

## Configuration & Props

`<Shell />` accepts the following props to align with enterprise controls:

| Prop          | Type               | Description                                                                 |
| ------------- | ------------------ | --------------------------------------------------------------------------- |
| `classNames`  | `string`           | Required. Tailwindshell command string.                                    |
| `sudo`        | `boolean`          | Run commands with elevated privileges.                                      |
| `env`         | `Record<string,string>` | Additional environment variables scoped to the command.                 |
| `cwd`         | `string`           | Working directory for execution.                                           |
| `timeout`     | `string \| number` | Execution timeout (e.g., `30s`, `2m`, or milliseconds).                     |
| `onOutput`    | `(chunk) => void`  | Optional streaming handler for stdout/stderr.                               |
| `onExit`      | `(code) => void`   | Optional completion handler.                                                |

> Prop names are illustrative; align them with your adapter implementation.

## Security & Compliance

- **Server-only**: Commands must never be exposed to the browser. Keep Tailwindshell components in server-only files (`'use server';` or framework equivalent).
- **Least privilege**: Avoid `sudo` unless strictly required. Prefer scoped service accounts.
- **Input validation**: Do not interpolate untrusted user input into class names. Validate and sanitize any dynamic tokens.
- **Audit trails**: Log executed commands, timestamps, and exit codes. Store logs centrally for compliance.
- **Secrets**: Inject sensitive values via environment variables or secret managers, not hard-coded strings.
- **Resource governance**: Use `timeout` and `nice`-style conventions to prevent runaway workloads.

## Operational Guidance

- **Observability**: Emit structured logs for start, success, failure, duration, and output sampling.
- **Rollout strategy**: Gate new command sets behind feature flags; ship incremental changes for safer rollout.
- **Change management**: Treat command updates like code—peer review, CI checks, and approvals.
- **Disaster recovery**: Predefine rollback commands (e.g., `systemctl-restart-previous` or `git-reset--hard-HEAD~1`).

## FAQ

**Does Tailwindshell run on the client?**  
No. It is designed exclusively for server-side execution.

**Can I pipe output to another `<Shell>` component?**  
Yes. Either chain commands within a single `classNames` string or orchestrate multiple components with shared storage (files, env vars, or process substitution).

**How do I handle long-running tasks?**  
Use `timeout-*` guards, stream output via `onOutput`, and consider backgrounding patterns (`nohup` or supervisors) when appropriate.

**Is sudo required?**  
Only when your command needs elevated access. Prefer delegating permissions to service users and minimize sudo usage.
