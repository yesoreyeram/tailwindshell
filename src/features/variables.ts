/**
 * Variable support for commands
 */

/**
 * Variable store for command execution
 */
export class VariableStore {
  private variables: Map<string, string> = new Map();

  /**
   * Set a variable
   */
  set(name: string, value: string): void {
    this.variables.set(name, value);
  }

  /**
   * Get a variable
   */
  get(name: string): string | undefined {
    return this.variables.get(name);
  }

  /**
   * Check if variable exists
   */
  has(name: string): boolean {
    return this.variables.has(name);
  }

  /**
   * Delete a variable
   */
  delete(name: string): boolean {
    return this.variables.delete(name);
  }

  /**
   * Clear all variables
   */
  clear(): void {
    this.variables.clear();
  }

  /**
   * Get all variables
   */
  getAll(): Record<string, string> {
    const result: Record<string, string> = {};
    this.variables.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Replace variables in a string
   */
  substitute(text: string): string {
    let result = text;

    // Replace $VAR and ${VAR} style variables
    this.variables.forEach((value, name) => {
      const regex1 = new RegExp(`\\$${name}(?![a-zA-Z0-9_])`, 'g');
      const regex2 = new RegExp(`\\$\\{${name}\\}`, 'g');

      result = result.replace(regex1, value);
      result = result.replace(regex2, value);
    });

    return result;
  }
}

/**
 * Parse variable assignment from command
 *
 * Examples:
 * - "set-VAR-value" -> { VAR: "value" }
 * - "export-PATH-/usr/bin" -> { PATH: "/usr/bin" }
 */
export function parseVariableAssignment(input: string): { name: string; value: string } | null {
  // Check for 'set-' prefix
  if (input.startsWith('set-')) {
    const parts = input.substring(4).split('-');
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parts.slice(1).join('/'); // Convert hyphens to slashes for paths
      return { name, value };
    }
  }

  // Check for 'export-' prefix
  if (input.startsWith('export-')) {
    const parts = input.substring(7).split('-');
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parts.slice(1).join('/');
      return { name, value };
    }
  }

  return null;
}

/**
 * Global variable store
 */
export const globalVariables = new VariableStore();
