/**
 * Command parser for Tailwind-style syntax
 */

import { ParsedCommand, ParserOptions, CommandOperator } from '../types';
import { Tokenizer, tokensToCommand, Token, TokenType } from './tokenizer';

export class CommandParser {
  // private options: ParserOptions; // Not currently used

  constructor(options: ParserOptions = {}) {
    // Store options for future use
    const _opts = {
      allowConditionals: true,
      allowLoops: true,
      allowVariables: true,
      ...options,
    };
    // Options configured but not currently used in parsing logic
    void _opts;
  }

  /**
   * Parse a Tailwind-style command string into a structured command
   *
   * Examples:
   * - "ls--la-/home" -> { command: "ls", args: ["/home"], flags: { "la": true } }
   * - "grep--color-auto-error-app.log" -> { command: "grep", args: ["error", "app.log"], flags: { "color": "auto" } }
   * - "cat-file_pipe_grep-error" -> { command: "cat", args: ["file"], operator: "pipe", nextCommand: {...} }
   */
  parse(input: string): ParsedCommand {
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.tokenize();

    return this.parseTokens(tokens);
  }

  private parseTokens(tokens: Token[]): ParsedCommand {
    if (tokens.length === 0) {
      throw new Error('No tokens to parse');
    }

    const commandToken = tokens.find((t) => t.type === 'command');
    if (!commandToken) {
      throw new Error('No command found in input');
    }

    const result: ParsedCommand = {
      command: commandToken.value,
      args: [],
      flags: {},
    };

    // Find operator position to split commands
    const operatorIndex = tokens.findIndex((t) =>
      ['pipe', 'and', 'or', 'semicolon', 'background'].includes(t.type)
    );

    // Parse tokens before operator (or all tokens if no operator)
    const currentTokens = operatorIndex === -1 ? tokens : tokens.slice(0, operatorIndex);

    for (const token of currentTokens) {
      if (token.type === 'flag') {
        this.parseFlag(token, result);
      } else if (token.type === 'arg') {
        result.args.push(token.value);
      }
    }

    // Handle operator and next command
    if (operatorIndex !== -1) {
      const operatorToken = tokens[operatorIndex];
      result.operator = this.getOperatorType(operatorToken.type as TokenType);

      // Recursively parse next command
      const remainingTokens = tokens.slice(operatorIndex + 1);
      if (remainingTokens.length > 0) {
        result.nextCommand = this.parseTokens(remainingTokens);
      }
    }

    return result;
  }

  private parseFlag(token: Token, result: ParsedCommand): void {
    const flagValue = token.value;

    // Check if flag has a value (e.g., "color auto" from "--color-auto")
    if (flagValue.includes(' ')) {
      const [flag, ...values] = flagValue.split(' ');
      result.flags[flag] = values.join(' ');
    } else if (flagValue.length === 1) {
      // Single character flags (e.g., -l, -a)
      for (const char of flagValue) {
        result.flags[char] = true;
      }
    } else {
      // Regular flag without value
      result.flags[flagValue] = true;
    }
  }

  private getOperatorType(tokenType: TokenType): CommandOperator {
    const mapping: Record<string, CommandOperator> = {
      pipe: 'pipe',
      and: 'and',
      or: 'or',
      semicolon: 'semicolon',
      background: 'background',
    };
    return mapping[tokenType] || 'semicolon';
  }

  /**
   * Convert parsed command back to shell command string
   */
  toShellCommand(parsed: ParsedCommand): string {
    const parts: string[] = [parsed.command];

    // Add flags
    for (const [key, value] of Object.entries(parsed.flags)) {
      if (value === true) {
        if (key.length === 1) {
          parts.push(`-${key}`);
        } else {
          parts.push(`--${key}`);
        }
      } else {
        if (key.length === 1) {
          parts.push(`-${key} ${value}`);
        } else {
          parts.push(`--${key} ${value}`);
        }
      }
    }

    // Add arguments
    parts.push(...parsed.args);

    let command = parts.join(' ');

    // Handle operator and next command
    if (parsed.operator && parsed.nextCommand) {
      const operatorSymbol = this.getOperatorSymbol(parsed.operator);
      const nextCommand = this.toShellCommand(parsed.nextCommand);
      command = `${command} ${operatorSymbol} ${nextCommand}`;
    }

    return command;
  }

  private getOperatorSymbol(operator: CommandOperator): string {
    const mapping: Record<CommandOperator, string> = {
      pipe: '|',
      and: '&&',
      or: '||',
      semicolon: ';',
      background: '&',
    };
    return mapping[operator];
  }

  /**
   * Validate parsed command structure
   */
  validate(parsed: ParsedCommand): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!parsed.command || parsed.command.trim().length === 0) {
      errors.push('Command cannot be empty');
    }

    // Validate command name (basic alphanumeric check)
    if (!/^[a-zA-Z0-9_\-./]+$/.test(parsed.command)) {
      errors.push(`Invalid command name: ${parsed.command}`);
    }

    // Recursively validate next command
    if (parsed.nextCommand) {
      const nextValidation = this.validate(parsed.nextCommand);
      errors.push(...nextValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export convenience functions
export { Tokenizer, tokensToCommand };

/**
 * Quick parse function
 */
export function parse(input: string, options?: ParserOptions): ParsedCommand {
  const parser = new CommandParser(options);
  return parser.parse(input);
}

/**
 * Quick conversion to shell command
 */
export function toShellCommand(parsed: ParsedCommand): string {
  const parser = new CommandParser();
  return parser.toShellCommand(parsed);
}
