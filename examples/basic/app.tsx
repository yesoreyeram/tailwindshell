import { Shell, ShellWithOutput } from 'tailwindshell';
import { useState } from 'react';

export default function BasicExample() {
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Tailwindshell Basic Example</h1>

      <section>
        <h2>Example 1: Simple Command</h2>
        <Shell
          classNames="echo-Hello-from-Tailwindshell!"
          onComplete={(result) => {
            console.log('Echo result:', result.stdout);
          }}
        />
      </section>

      <section>
        <h2>Example 2: List Files</h2>
        <ShellWithOutput
          classNames="ls--la"
          onComplete={(result) => {
            setOutput(result.stdout);
          }}
          onError={(err) => {
            setError(err.message);
          }}
        />
        {output && (
          <pre style={{ background: '#f0f0f0', padding: '10px' }}>
            {output}
          </pre>
        )}
        {error && (
          <pre style={{ background: '#ffcccc', padding: '10px' }}>
            {error}
          </pre>
        )}
      </section>

      <section>
        <h2>Example 3: Piped Commands</h2>
        <Shell
          classNames="echo-test_pipe_grep-t_pipe_wc--l"
          verbose={true}
          onComplete={(result) => {
            console.log('Pipe result:', result);
          }}
        />
      </section>

      <section>
        <h2>Example 4: With Security Policy</h2>
        <Shell
          classNames="cat-/etc/hosts"
          securityPolicy={{
            allowedCommands: ['cat'],
            allowedPaths: ['/etc/hosts'],
            maxExecutionTime: 5000,
          }}
          onComplete={(result) => {
            console.log('Hosts file length:', result.stdout.length);
          }}
          onError={(err) => {
            console.error('Security error:', err.message);
          }}
        />
      </section>

      <section>
        <h2>Example 5: Dry Run Mode</h2>
        <Shell
          classNames="rm--rf-/"
          dryRun={true}
          onComplete={(result) => {
            console.log('Dry run:', result.stdout);
          }}
        />
      </section>

      <section>
        <h2>Example 6: Working Directory</h2>
        <Shell
          classNames="pwd"
          cwd="/tmp"
          onComplete={(result) => {
            console.log('Current directory:', result.stdout);
          }}
        />
      </section>

      <section>
        <h2>Example 7: Environment Variables</h2>
        <Shell
          classNames="echo-$CUSTOM_VAR"
          env={{ CUSTOM_VAR: 'Hello from environment!' }}
          onComplete={(result) => {
            console.log('Env var:', result.stdout);
          }}
        />
      </section>
    </div>
  );
}
