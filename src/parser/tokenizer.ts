/**
 * Tokenizer for Tailwind-style command syntax
 */

export type TokenType =
  | 'command'
  | 'flag'
  | 'arg'
  | 'pipe'
  | 'and'
  | 'or'
  | 'semicolon'
  | 'redirect'
  | 'background';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Tokenize a Tailwind-style command string
 * Examples:
 * - "ls--la-/home" -> ls -la /home
 * - "cat-file.txt_pipe_grep-error" -> cat file.txt | grep error
 * - "echo-hello_and_echo-world" -> echo hello && echo world
 */
export class Tokenizer {
  private input: string;
  private position: number = 0;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;

    if (!this.input) {
      return this.tokens;
    }

    // First token is always the command
    const commandEnd = this.findNextSeparator();
    const commandValue = this.input.substring(0, commandEnd).replace(/-/g, ' ').trim();

    this.tokens.push({
      type: 'command',
      value: commandValue,
      position: 0,
    });

    this.position = commandEnd;

    // Parse the rest
    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) {
        break;
      }

      // Check for operators
      if (this.checkOperator('_pipe_')) {
        this.tokens.push({ type: 'pipe', value: '|', position: this.position });
        this.position += 6;
        continue;
      }

      if (this.checkOperator('_and_')) {
        this.tokens.push({ type: 'and', value: '&&', position: this.position });
        this.position += 5;
        continue;
      }

      if (this.checkOperator('_or_')) {
        this.tokens.push({ type: 'or', value: '||', position: this.position });
        this.position += 4;
        continue;
      }

      if (this.checkOperator('_then_')) {
        this.tokens.push({ type: 'semicolon', value: ';', position: this.position });
        this.position += 6;
        continue;
      }

      if (this.checkOperator('_bg_')) {
        this.tokens.push({ type: 'background', value: '&', position: this.position });
        this.position += 4;
        continue;
      }

      // Parse argument or flag
      this.parseArgument();
    }

    return this.tokens;
  }

  private findNextSeparator(): number {
    const separators = ['_pipe_', '_and_', '_or_', '_then_', '_bg_', ' '];
    let minIndex = this.input.length;

    for (const sep of separators) {
      const index = this.input.indexOf(sep, this.position);
      if (index !== -1 && index < minIndex) {
        minIndex = index;
      }
    }

    return minIndex;
  }

  private checkOperator(operator: string): boolean {
    return this.input.substring(this.position, this.position + operator.length) === operator;
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && this.input[this.position] === ' ') {
      this.position++;
    }
  }

  private parseArgument(): void {
    const start = this.position;
    let end = this.findNextSeparator();

    if (end <= start) {
      end = this.input.length;
    }

    const segment = this.input.substring(start, end);

    // Check if it's a flag (starts with --)
    if (segment.startsWith('--')) {
      const flagValue = segment.substring(2).replace(/-/g, ' ').trim();
      this.tokens.push({
        type: 'flag',
        value: flagValue,
        position: start,
      });
    } else if (segment.startsWith('-') && segment.length > 1) {
      // Short flags
      const flagValue = segment.substring(1);
      this.tokens.push({
        type: 'flag',
        value: flagValue,
        position: start,
      });
    } else {
      // Regular argument - convert hyphens to slashes for paths
      let argValue = segment.replace(/-/g, '/');

      // Handle special cases where we want to preserve hyphens
      // For example, if it looks like a command option value
      if (this.tokens.length > 0) {
        const lastToken = this.tokens[this.tokens.length - 1];
        if (lastToken.type === 'flag' && !argValue.startsWith('/')) {
          argValue = segment; // Keep original for non-path arguments
        }
      }

      this.tokens.push({
        type: 'arg',
        value: argValue,
        position: start,
      });
    }

    this.position = end;
  }
}

/**
 * Convert tokens to shell command string
 */
export function tokensToCommand(tokens: Token[]): string {
  const parts: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'command':
        parts.push(token.value);
        break;
      case 'flag':
        if (token.value.length === 1) {
          parts.push(`-${token.value}`);
        } else if (token.value.includes(' ')) {
          // Long flag with value (e.g., "format json" -> "--format json")
          const [flag, ...values] = token.value.split(' ');
          parts.push(`--${flag} ${values.join(' ')}`);
        } else {
          parts.push(`--${token.value}`);
        }
        break;
      case 'arg':
        parts.push(token.value);
        break;
      case 'pipe':
      case 'and':
      case 'or':
      case 'semicolon':
      case 'background':
        parts.push(token.value);
        break;
    }
  }

  return parts.join(' ');
}
