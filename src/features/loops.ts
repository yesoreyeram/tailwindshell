/**
 * Loop execution support
 */

import { LoopConfig, ParsedCommand } from '../types';
import { parse, toShellCommand } from '../parser';

/**
 * Parse loop syntax
 *
 * Examples:
 * - "for-file-in-*.txt_do_cat-$file"
 * - "while-test--f-file.txt_do_sleep-1"
 */
export function parseLoop(input: string): LoopConfig | null {
  // Check for 'for' loop
  if (input.startsWith('for-')) {
    return parseForLoop(input);
  }

  // Check for 'while' loop
  if (input.startsWith('while-')) {
    return parseWhileLoop(input);
  }

  return null;
}

/**
 * Parse for loop
 */
function parseForLoop(input: string): LoopConfig {
  // Find _in_ separator
  const inIndex = input.indexOf('_in_');
  if (inIndex === -1) {
    throw new Error('For loop must contain _in_ separator');
  }

  // Find _do_ separator
  const doIndex = input.indexOf('_do_', inIndex);
  if (doIndex === -1) {
    throw new Error('For loop must contain _do_ separator');
  }

  // Extract iterator variable (remove 'for-' prefix)
  const iterator = input.substring(4, inIndex);

  // Extract items list
  const itemsStr = input.substring(inIndex + 4, doIndex);
  const items = itemsStr.split('-').filter((item) => item.length > 0);

  // Extract command
  const command = input.substring(doIndex + 4);

  return {
    type: 'for',
    iterator,
    items,
    command,
  };
}

/**
 * Parse while loop
 */
function parseWhileLoop(input: string): LoopConfig {
  // Find _do_ separator
  const doIndex = input.indexOf('_do_');
  if (doIndex === -1) {
    throw new Error('While loop must contain _do_ separator');
  }

  // Extract condition (remove 'while-' prefix)
  const condition = input.substring(6, doIndex);

  // Extract command
  const command = input.substring(doIndex + 4);

  return {
    type: 'while',
    iterator: '',
    condition,
    command,
  };
}

/**
 * Convert loop to shell command
 */
export function loopToShell(config: LoopConfig): string {
  const parts: string[] = [];

  if (config.type === 'for') {
    // For loop
    const items = config.items?.join(' ') || '';
    parts.push(`for ${config.iterator} in ${items}; do`);

    // Replace $iterator in command
    const commandWithVar = config.command.replace(
      new RegExp(`\\$${config.iterator}`, 'g'),
      `$${config.iterator}`
    );
    const commandParsed = parse(commandWithVar);
    const commandShell = toShellCommand(commandParsed);

    parts.push(`  ${commandShell}`);
    parts.push('done');
  } else {
    // While loop
    const conditionParsed = parse(config.condition || '');
    const conditionShell = toShellCommand(conditionParsed);

    parts.push(`while ${conditionShell}; do`);

    const commandParsed = parse(config.command);
    const commandShell = toShellCommand(commandParsed);

    parts.push(`  ${commandShell}`);
    parts.push('done');
  }

  return parts.join('\n');
}

/**
 * Execute for loop
 */
export async function executeForLoop(
  config: LoopConfig,
  executor: { execute: (parsed: ParsedCommand) => Promise<unknown> }
): Promise<void> {
  if (!config.items) {
    throw new Error('For loop requires items');
  }

  for (const item of config.items) {
    // Replace iterator variable in command
    const commandWithValue = config.command.replace(
      new RegExp(`\\$${config.iterator}`, 'g'),
      item
    );

    const parsed = parse(commandWithValue);
    await executor.execute(parsed);
  }
}

/**
 * Execute while loop (with safety limit)
 */
export async function executeWhileLoop(
  config: LoopConfig,
  executor: { execute: (parsed: ParsedCommand) => Promise<unknown> },
  maxIterations: number = 1000
): Promise<void> {
  if (!config.condition) {
    throw new Error('While loop requires condition');
  }

  let iterations = 0;

  while (iterations < maxIterations) {
    // Execute condition
    const conditionParsed = parse(config.condition);
    const conditionResult = await executor.execute(conditionParsed);

    // Check if condition succeeded
    const success = (conditionResult as { exitCode: number }).exitCode === 0;
    if (!success) {
      break;
    }

    // Execute command
    const commandParsed = parse(config.command);
    await executor.execute(commandParsed);

    iterations++;
  }

  if (iterations >= maxIterations) {
    throw new Error(`While loop exceeded maximum iterations (${maxIterations})`);
  }
}
