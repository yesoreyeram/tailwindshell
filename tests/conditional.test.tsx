/**
 * Tests for IF, ElseIf, Else components
 */

import { render, waitFor } from '@testing-library/react';
import { IF, ElseIf, Else } from '../src/workflow/IF';

describe('IF Component', () => {
  it('should render children when condition is true', async () => {
    const { container } = render(
      <IF condition={true}>
        <div data-testid="if-content">IF Content</div>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).toBeInTheDocument();
    });
  });

  it('should not render children when condition is false', async () => {
    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).not.toBeInTheDocument();
    });
  });

  it('should handle function conditions', async () => {
    const condition = jest.fn(() => true);

    const { container } = render(
      <IF condition={condition}>
        <div data-testid="if-content">IF Content</div>
      </IF>
    );

    await waitFor(() => {
      expect(condition).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="if-content"]')).toBeInTheDocument();
    });
  });

  it('should handle async function conditions', async () => {
    const condition = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return true;
    };

    const { container } = render(
      <IF condition={condition}>
        <div data-testid="if-content">IF Content</div>
      </IF>
    );

    await waitFor(
      () => {
        expect(container.querySelector('[data-testid="if-content"]')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should render Else when condition is false', async () => {
    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <Else>
          <div data-testid="else-content">Else Content</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="else-content"]')).toBeInTheDocument();
    });
  });

  it('should not render Else when condition is true', async () => {
    const { container } = render(
      <IF condition={true}>
        <div data-testid="if-content">IF Content</div>
        <Else>
          <div data-testid="else-content">Else Content</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="else-content"]')).not.toBeInTheDocument();
    });
  });
});

describe('IF with ElseIf', () => {
  it('should render IF content when first condition is true', async () => {
    const { container } = render(
      <IF condition={true}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={true}>
          <div data-testid="elseif-content">ElseIf Content</div>
        </ElseIf>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif-content"]')).not.toBeInTheDocument();
    });
  });

  it('should render ElseIf content when IF condition is false and ElseIf condition is true', async () => {
    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={true}>
          <div data-testid="elseif-content">ElseIf Content</div>
        </ElseIf>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif-content"]')).toBeInTheDocument();
    });
  });

  it('should handle multiple ElseIf branches', async () => {
    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={false}>
          <div data-testid="elseif1-content">ElseIf 1</div>
        </ElseIf>
        <ElseIf condition={true}>
          <div data-testid="elseif2-content">ElseIf 2</div>
        </ElseIf>
        <ElseIf condition={true}>
          <div data-testid="elseif3-content">ElseIf 3</div>
        </ElseIf>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif1-content"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif2-content"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif3-content"]')).not.toBeInTheDocument();
    });
  });

  it('should render Else when all conditions are false', async () => {
    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={false}>
          <div data-testid="elseif-content">ElseIf Content</div>
        </ElseIf>
        <Else>
          <div data-testid="else-content">Else Content</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if-content"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif-content"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="else-content"]')).toBeInTheDocument();
    });
  });
});

describe('IF with async ElseIf conditions', () => {
  it('should handle async ElseIf conditions', async () => {
    const asyncCondition = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return true;
    };

    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={asyncCondition}>
          <div data-testid="elseif-content">ElseIf Content</div>
        </ElseIf>
      </IF>
    );

    await waitFor(
      () => {
        expect(container.querySelector('[data-testid="elseif-content"]')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should evaluate ElseIf conditions sequentially', async () => {
    const calls: number[] = [];

    const condition1 = async () => {
      calls.push(1);
      await new Promise((resolve) => setTimeout(resolve, 20));
      return false;
    };

    const condition2 = async () => {
      calls.push(2);
      await new Promise((resolve) => setTimeout(resolve, 20));
      return true;
    };

    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={condition1}>
          <div data-testid="elseif1-content">ElseIf 1</div>
        </ElseIf>
        <ElseIf condition={condition2}>
          <div data-testid="elseif2-content">ElseIf 2</div>
        </ElseIf>
      </IF>
    );

    await waitFor(
      () => {
        expect(container.querySelector('[data-testid="elseif2-content"]')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // Conditions should be evaluated in order
    expect(calls).toEqual([1, 2]);
  });
});

describe('IF with complex nesting', () => {
  it('should handle multiple children in each branch', async () => {
    const { container } = render(
      <IF condition={false}>
        <div data-testid="if1">IF 1</div>
        <div data-testid="if2">IF 2</div>
        <ElseIf condition={true}>
          <div data-testid="elseif1">ElseIf 1</div>
          <div data-testid="elseif2">ElseIf 2</div>
          <div data-testid="elseif3">ElseIf 3</div>
        </ElseIf>
        <Else>
          <div data-testid="else1">Else 1</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="if1"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="if2"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif1"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif2"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="elseif3"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="else1"]')).not.toBeInTheDocument();
    });
  });

  it('should handle nested IF statements', async () => {
    const { container } = render(
      <IF condition={true}>
        <div data-testid="outer-if">Outer IF</div>
        <IF condition={true}>
          <div data-testid="inner-if">Inner IF</div>
          <Else>
            <div data-testid="inner-else">Inner Else</div>
          </Else>
        </IF>
        <Else>
          <div data-testid="outer-else">Outer Else</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="outer-if"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="inner-if"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="inner-else"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-testid="outer-else"]')).not.toBeInTheDocument();
    });
  });
});

describe('IF error handling', () => {
  it('should handle condition evaluation errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const errorCondition = async () => {
      throw new Error('Condition evaluation failed');
    };

    const { container } = render(
      <IF condition={errorCondition}>
        <div data-testid="if-content">IF Content</div>
        <Else>
          <div data-testid="else-content">Else Content</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="else-content"]')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should handle ElseIf condition evaluation errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const errorCondition = async () => {
      throw new Error('ElseIf condition evaluation failed');
    };

    const { container } = render(
      <IF condition={false}>
        <div data-testid="if-content">IF Content</div>
        <ElseIf condition={errorCondition}>
          <div data-testid="elseif-content">ElseIf Content</div>
        </ElseIf>
        <Else>
          <div data-testid="else-content">Else Content</div>
        </Else>
      </IF>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(container.querySelector('[data-testid="else-content"]')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});

describe('IF verbose mode', () => {
  it('should log when verbose is enabled', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <IF condition={true} verbose={true}>
        <div data-testid="content">Content</div>
      </IF>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[IF] Evaluating condition');
      expect(consoleSpy).toHaveBeenCalledWith('[IF] Condition result:', true);
      expect(consoleSpy).toHaveBeenCalledWith('[IF] Rendering IF branch');
    });

    consoleSpy.mockRestore();
  });
});
