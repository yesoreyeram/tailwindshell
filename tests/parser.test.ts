import { CommandParser, parse, toShellCommand } from '../src/parser';
import { Tokenizer, tokensToCommand } from '../src/parser/tokenizer';

describe('Tokenizer', () => {
  it('should tokenize simple command', () => {
    const tokenizer = new Tokenizer('ls--la-/home');
    const tokens = tokenizer.tokenize();

    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ type: 'command', value: 'ls', position: 0 });
    expect(tokens[1]).toEqual({ type: 'flag', value: 'la', position: expect.any(Number) });
    expect(tokens[2]).toEqual({ type: 'arg', value: '/home', position: expect.any(Number) });
  });

  it('should tokenize command with pipe', () => {
    const tokenizer = new Tokenizer('cat-file.txt_pipe_grep-error');
    const tokens = tokenizer.tokenize();

    expect(tokens.some((t) => t.type === 'pipe')).toBe(true);
    expect(tokens.some((t) => t.type === 'command' && t.value === 'cat')).toBe(true);
  });

  it('should tokenize command with and operator', () => {
    const tokenizer = new Tokenizer('echo-hello_and_echo-world');
    const tokens = tokenizer.tokenize();

    expect(tokens.some((t) => t.type === 'and')).toBe(true);
  });

  it('should convert tokens to command string', () => {
    const tokenizer = new Tokenizer('ls--la-/home');
    const tokens = tokenizer.tokenize();
    const command = tokensToCommand(tokens);

    expect(command).toContain('ls');
    expect(command).toContain('-la');
    expect(command).toContain('/home');
  });
});

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  it('should parse simple command', () => {
    const result = parse('ls--la-/home');

    expect(result.command).toBe('ls');
    expect(result.args).toContain('/home');
    expect(result.flags).toHaveProperty('la');
  });

  it('should parse command with long flags', () => {
    const result = parse('grep--color-auto-error-app.log');

    expect(result.command).toBe('grep');
    expect(result.flags).toHaveProperty('color');
    expect(result.args).toContain('error');
    expect(result.args).toContain('app.log');
  });

  it('should parse piped commands', () => {
    const result = parse('cat-file.txt_pipe_grep-error');

    expect(result.command).toBe('cat');
    expect(result.operator).toBe('pipe');
    expect(result.nextCommand).toBeDefined();
    expect(result.nextCommand?.command).toBe('grep');
  });

  it('should parse chained commands with and', () => {
    const result = parse('mkdir-test_and_cd-test');

    expect(result.command).toBe('mkdir');
    expect(result.operator).toBe('and');
    expect(result.nextCommand?.command).toBe('cd');
  });

  it('should convert parsed command to shell command', () => {
    const parsed = parse('ls--la-/home');
    const shellCmd = toShellCommand(parsed);

    expect(shellCmd).toContain('ls');
    expect(shellCmd).toContain('--la');
    expect(shellCmd).toContain('/home');
  });

  it('should validate parsed command', () => {
    const parsed = parse('ls--la-/home');
    const validation = parser.validate(parsed);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject invalid command names', () => {
    const parsed = {
      command: 'invalid!@#',
      args: [],
      flags: {},
    };
    const validation = parser.validate(parsed);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe('Complex parsing scenarios', () => {
  it('should handle multiple pipes', () => {
    const result = parse('cat-file_pipe_grep-error_pipe_wc--l');

    expect(result.operator).toBe('pipe');
    expect(result.nextCommand?.operator).toBe('pipe');
    expect(result.nextCommand?.nextCommand?.command).toBe('wc');
  });

  it('should handle mixed operators', () => {
    const result = parse('test--f-file.txt_and_cat-file.txt_pipe_grep-error');

    expect(result.operator).toBe('and');
    expect(result.nextCommand?.operator).toBe('pipe');
  });
});
