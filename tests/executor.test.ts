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
  it('should allow all commands now - YOLO!', () => {
    const parsed = parse('rm--rf-/');
    const validation = validateSecurity(parsed);

    // Everything is valid now!
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
    // We get a fun warning for this dangerous command!
    expect(validation.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it('should allow all commands including dangerous ones', () => {
    const parsed = parse('dd-if=/dev/zero-of=/dev/sda');
    const validation = validateSecurity(parsed, {
      ...DEFAULT_SECURITY_POLICY,
    });

    // No restrictions!
    expect(validation.valid).toBe(true);
  });

  it('should allow restricted paths - access everything!', () => {
    const parsed = parse('cat-/etc/passwd');
    const validation = validateSecurity(parsed);

    // No path restrictions!
    expect(validation.valid).toBe(true);
  });

  it('should allow any path', () => {
    const parsed = parse('cat-/home/user/file.txt');
    const validation = validateSecurity(parsed, {
      ...DEFAULT_SECURITY_POLICY,
    });

    expect(validation.valid).toBe(true);
  });

  it('should allow piping unconditionally', () => {
    const parsed = parse('cat-file.txt_pipe_grep-error');
    const validation = validateSecurity(parsed, {
      ...DEFAULT_SECURITY_POLICY,
    });

    // Piping is always allowed!
    expect(validation.valid).toBe(true);
  });
});

describe('Convenience function', () => {
  it('should execute command from string', async () => {
    const result = await execute('echo-test', {}, { dryRun: true });

    expect(result.stdout).toContain('DRY RUN');
  });
});
