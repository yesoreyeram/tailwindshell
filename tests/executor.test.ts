import { CommandExecutor, execute } from '../src/executor';
import { validateSecurity, DEFAULT_SECURITY_POLICY } from '../src/executor/security';
import { parse } from '../src/parser';

describe('CommandExecutor', () => {
  let executor: CommandExecutor;

  beforeEach(() => {
    executor = new CommandExecutor({
      timeout: 5000,
      verbose: false,
    });
  });

  it('should execute simple command', async () => {
    const parsed = parse('echo-hello');
    const result = await executor.execute(parsed);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
  });

  it('should handle command timeout', async () => {
    const shortExecutor = new CommandExecutor({ timeout: 100 });
    const parsed = parse('sleep-5');

    await expect(shortExecutor.execute(parsed)).rejects.toThrow('timeout');
  }, 10000);

  it('should execute in dry run mode', async () => {
    const parsed = parse('rm--rf-/');
    const result = await executor.execute(parsed, { dryRun: true });

    expect(result.stdout).toContain('DRY RUN');
    expect(result.exitCode).toBe(0);
  });

  it('should capture stderr', async () => {
    const parsed = parse('ls-nonexistent');
    const result = await executor.execute(parsed);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  it('should update execution context', () => {
    executor.updateContext({ cwd: '/tmp' });
    const context = executor.getContext();

    expect(context.cwd).toBe('/tmp');
  });
});

describe('Security validation', () => {
  it('should block dangerous commands', () => {
    const parsed = parse('rm--rf-/');
    const validation = validateSecurity(parsed);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should allow safe commands', () => {
    const parsed = parse('echo-hello');
    const validation = validateSecurity(parsed, {
      ...DEFAULT_SECURITY_POLICY,
      allowedCommands: ['echo'],
    });

    expect(validation.valid).toBe(true);
  });

  it('should block restricted paths', () => {
    const parsed = parse('cat-/etc/passwd');
    const validation = validateSecurity(parsed);

    expect(validation.valid).toBe(false);
  });

  it('should allow whitelisted paths', () => {
    const parsed = parse('cat-/home/user/file.txt');
    const validation = validateSecurity(parsed, {
      ...DEFAULT_SECURITY_POLICY,
      allowedPaths: ['/home/user'],
      blockedPaths: [],
      allowedCommands: ['cat'],
    });

    expect(validation.valid).toBe(true);
  });

  it('should validate piping policy', () => {
    const parsed = parse('cat-file_pipe_grep-error');
    const validation = validateSecurity(parsed, {
      ...DEFAULT_SECURITY_POLICY,
      allowPiping: false,
    });

    expect(validation.valid).toBe(false);
  });
});

describe('Convenience function', () => {
  it('should execute command from string', async () => {
    const result = await execute('echo-test', {}, { dryRun: true });

    expect(result.stdout).toContain('DRY RUN');
  });
});
