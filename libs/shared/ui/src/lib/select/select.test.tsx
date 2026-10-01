import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Select } from './select';

const items = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
];

describe('Select', () => {
  it('shows the placeholder, then the chosen item, and reports the value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Stroke" placeholder="Pick one" items={items} onValueChange={onValueChange} />, {
      wrapper: UiProvider,
    });

    const trigger = screen.getByRole('combobox', { name: 'Stroke' });
    expect(trigger.textContent).toContain('Pick one');

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Dashed' }));

    expect(onValueChange).toHaveBeenCalledWith(['dashed']);
    await waitFor(() => expect(trigger.textContent).toContain('Dashed'));
  });
});
