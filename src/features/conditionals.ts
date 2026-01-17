/**
 * Conditional execution support
 */

import { ParsedCommand, ConditionalConfig } from '../types';
import { parse, toShellCommand } from '../parser';

/**
 * Parse conditional syntax
 *
 * Examples:
 * - "if-test--f-file.txt_then_cat-file.txt_else_echo-not-found"
 * - "if-command-v-node_then_node--version"
 */
export function parseConditional(input: string): ConditionalConfig | null {
  // Check if it's a conditional command
  if (!input.startsWith('if-')) {
    return null;
  }

  // Find _then_ separator
  const thenIndex = input.indexOf('_then_');
  if (thenIndex === -1) {
    throw new Error('Conditional command must contain _then_ separator');
  }

  // Extract condition (remove 'if-' prefix)
  const condition = input.substring(3, thenIndex);

  // Find _else_ separator (optional)
  const elseIndex = input.indexOf('_else_', thenIndex);

  let trueCommand: string;
  let falseCommand: string | undefined;

  if (elseIndex !== -1) {
    // Has else clause
    trueCommand = input.substring(thenIndex + 6, elseIndex);
    falseCommand = input.substring(elseIndex + 6);
  } else {
    // No else clause
    trueCommand = input.substring(thenIndex + 6);
  }

  return {
    condition,
    trueCommand,
    falseCommand,
  };
}

/**
 * Convert conditional to shell command
 */
export function conditionalToShell(config: ConditionalConfig): string {
  const parts: string[] = [];

  // Parse condition
  const conditionParsed = parse(config.condition);
  const conditionShell = toShellCommand(conditionParsed);

  // Parse true command
  const trueParsed = parse(config.trueCommand);
  const trueShell = toShellCommand(trueParsed);

  // Build if-then-else structure
  parts.push(`if ${conditionShell}; then`);
  parts.push(`  ${trueShell}`);

  if (config.falseCommand) {
    const falseParsed = parse(config.falseCommand);
    const falseShell = toShellCommand(falseParsed);
    parts.push('else');
    parts.push(`  ${falseShell}`);
  }

  parts.push('fi');

  return parts.join('\n');
}

/**
 * Execute conditional command
 */
export async function executeConditional(
  config: ConditionalConfig,
  executor: { execute: (parsed: ParsedCommand) => Promise<unknown> }
): Promise<void> {
  // Execute condition
  const conditionParsed = parse(config.condition);
  const conditionResult = await executor.execute(conditionParsed);

  // Check if condition succeeded (exit code 0)
  const success = (conditionResult as { exitCode: number }).exitCode === 0;

  // Execute appropriate command
  if (success) {
    const trueParsed = parse(config.trueCommand);
    await executor.execute(trueParsed);
  } else if (config.falseCommand) {
    const falseParsed = parse(config.falseCommand);
    await executor.execute(falseParsed);
  }
}
