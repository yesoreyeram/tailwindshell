import {
  escapeShellArg,
  isCommandAllowed,
  isPathAllowed,
  parseEnvVars,
  formatDuration,
  validateCommandString,
  sanitizeOutput,
} from '../src/utils';

describe('Utils', () => {
  describe('escapeShellArg', () => {
    it('should escape single quotes', () => {
      const result = escapeShellArg("it's a test");

      expect(result).toContain("'it'\\''s a test'");
    });

    it('should wrap in single quotes', () => {
      const result = escapeShellArg('test');

      expect(result).toBe("'test'");
    });
  });

  describe('isCommandAllowed', () => {
    it('should allow command in allowed list', () => {
      expect(isCommandAllowed('ls', ['ls', 'cat'])).toBe(true);
    });

    it('should block command in blocked list', () => {
      expect(isCommandAllowed('rm', undefined, ['rm', 'dd'])).toBe(false);
    });

    it('should allow by default if no restrictions', () => {
      expect(isCommandAllowed('ls')).toBe(true);
    });

    it('should block if not in allowed list', () => {
      expect(isCommandAllowed('rm', ['ls', 'cat'])).toBe(false);
    });
  });

  describe('isPathAllowed', () => {
    it('should allow path in allowed list', () => {
      expect(isPathAllowed('/home/user/file', ['/home/user'])).toBe(true);
    });

    it('should block path in blocked list', () => {
      expect(isPathAllowed('/etc/passwd', undefined, ['/etc'])).toBe(false);
    });

    it('should allow by default if no restrictions', () => {
      expect(isPathAllowed('/home/user/file')).toBe(true);
    });
  });

  describe('parseEnvVars', () => {
    it('should parse environment variables', () => {
      const result = parseEnvVars(['FOO=bar', 'BAZ=qux']);

      expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
    });

    it('should handle values with equals signs', () => {
      const result = parseEnvVars(['URL=http://example.com?a=b']);

      expect(result.URL).toBe('http://example.com?a=b');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(2500)).toBe('2.50s');
    });

    it('should format minutes', () => {
      expect(formatDuration(125000)).toContain('2m');
    });
  });

  describe('validateCommandString', () => {
    it('should validate safe command', () => {
      const result = validateCommandString('ls -la');

      expect(result.valid).toBe(true);
    });

    it('should reject empty command', () => {
      const result = validateCommandString('');

      expect(result.valid).toBe(false);
    });

    it('should reject dangerous patterns', () => {
      const result = validateCommandString('rm -rf /');

      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeOutput', () => {
    it('should not truncate short output', () => {
      const output = 'Hello World';
      expect(sanitizeOutput(output)).toBe(output);
    });

    it('should truncate long output', () => {
      const output = 'x'.repeat(20000);
      const sanitized = sanitizeOutput(output);

      expect(sanitized.length).toBeLessThan(output.length);
      expect(sanitized).toContain('truncated');
    });
  });
});
