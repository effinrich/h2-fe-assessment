import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { NumberInput } from './number-input';

describe('NumberInput', () => {
  it('reports the parsed number alongside the raw string', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberInput label="Width" defaultValue="2" onValueChange={onValueChange} />, { wrapper: UiProvider });
    const input = screen.getByRole('spinbutton', { name: 'Width' });

    await user.clear(input);
    await user.type(input, '7');

    expect(onValueChange).toHaveBeenLastCalledWith(7, '7');
  });

  it('steps with the arrow keys and clamps to max', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberInput label="Width" defaultValue="9" max={10} onValueChange={onValueChange} />, {
      wrapper: UiProvider,
    });
    const input = screen.getByRole('spinbutton', { name: 'Width' });

    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith(10, '10');

    await user.keyboard('{ArrowUp}');
    expect(onValueChange).not.toHaveBeenCalledWith(11, '11');
    await waitFor(() => expect((input as HTMLInputElement).value).toBe('10'));
  });
});
