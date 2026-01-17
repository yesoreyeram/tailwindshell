import { parseConditional, conditionalToShell } from '../src/features/conditionals';
import { parseLoop, loopToShell } from '../src/features/loops';
import { VariableStore, parseVariableAssignment } from '../src/features/variables';

describe('Conditionals', () => {
  it('should parse conditional with if-then', () => {
    const config = parseConditional('if-test--f-file.txt_then_cat-file.txt');

    expect(config).not.toBeNull();
    expect(config?.condition).toBe('test--f-file.txt');
    expect(config?.trueCommand).toBe('cat-file.txt');
    expect(config?.falseCommand).toBeUndefined();
  });

  it('should parse conditional with if-then-else', () => {
    const config = parseConditional(
      'if-test--f-file.txt_then_cat-file.txt_else_echo-not-found'
    );

    expect(config).not.toBeNull();
    expect(config?.condition).toBe('test--f-file.txt');
    expect(config?.trueCommand).toBe('cat-file.txt');
    expect(config?.falseCommand).toBe('echo-not-found');
  });

  it('should convert conditional to shell command', () => {
    const config = {
      condition: 'test--f-file.txt',
      trueCommand: 'cat-file.txt',
      falseCommand: 'echo-not-found',
    };

    const shell = conditionalToShell(config);

    expect(shell).toContain('if');
    expect(shell).toContain('then');
    expect(shell).toContain('else');
    expect(shell).toContain('fi');
  });

  it('should return null for non-conditional input', () => {
    const config = parseConditional('echo-hello');

    expect(config).toBeNull();
  });
});

describe('Loops', () => {
  it('should parse for loop', () => {
    const config = parseLoop('for-file-in-*.txt_do_cat-$file');

    expect(config).not.toBeNull();
    expect(config?.type).toBe('for');
    expect(config?.iterator).toBe('file');
    expect(config?.items).toContain('*.txt');
    expect(config?.command).toBe('cat-$file');
  });

  it('should parse while loop', () => {
    const config = parseLoop('while-test--f-file.txt_do_sleep-1');

    expect(config).not.toBeNull();
    expect(config?.type).toBe('while');
    expect(config?.condition).toBe('test--f-file.txt');
    expect(config?.command).toBe('sleep-1');
  });

  it('should convert for loop to shell command', () => {
    const config = {
      type: 'for' as const,
      iterator: 'file',
      items: ['file1.txt', 'file2.txt'],
      command: 'cat-$file',
    };

    const shell = loopToShell(config);

    expect(shell).toContain('for file in');
    expect(shell).toContain('do');
    expect(shell).toContain('done');
  });

  it('should return null for non-loop input', () => {
    const config = parseLoop('echo-hello');

    expect(config).toBeNull();
  });
});

describe('Variables', () => {
  let store: VariableStore;

  beforeEach(() => {
    store = new VariableStore();
  });

  it('should set and get variables', () => {
    store.set('FOO', 'bar');

    expect(store.get('FOO')).toBe('bar');
    expect(store.has('FOO')).toBe(true);
  });

  it('should delete variables', () => {
    store.set('FOO', 'bar');
    store.delete('FOO');

    expect(store.has('FOO')).toBe(false);
  });

  it('should substitute variables in text', () => {
    store.set('NAME', 'world');
    const result = store.substitute('Hello $NAME!');

    expect(result).toBe('Hello world!');
  });

  it('should substitute variables with braces', () => {
    store.set('NAME', 'world');
    const result = store.substitute('Hello ${NAME}!');

    expect(result).toBe('Hello world!');
  });

  it('should parse variable assignment', () => {
    const assignment = parseVariableAssignment('set-FOO-bar');

    expect(assignment).not.toBeNull();
    expect(assignment?.name).toBe('FOO');
    expect(assignment?.value).toBe('bar');
  });

  it('should parse export statement', () => {
    const assignment = parseVariableAssignment('export-PATH-/usr/bin');

    expect(assignment).not.toBeNull();
    expect(assignment?.name).toBe('PATH');
    expect(assignment?.value).toBe('/usr/bin');
  });

  it('should return null for non-assignment input', () => {
    const assignment = parseVariableAssignment('echo-hello');

    expect(assignment).toBeNull();
  });

  it('should get all variables', () => {
    store.set('FOO', 'bar');
    store.set('BAZ', 'qux');

    const all = store.getAll();

    expect(all).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });
});
