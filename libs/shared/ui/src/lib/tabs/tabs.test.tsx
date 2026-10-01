import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Tabs } from './tabs';

const items = [
  { value: 'shapes', label: 'Shapes', content: 'All shapes' },
  { value: 'pins', label: 'Pins', content: 'All pins' },
];

describe('Tabs', () => {
  it('opens on the first tab by default', () => {
    render(<Tabs items={items} />, { wrapper: UiProvider });

    expect(screen.getByRole('tab', { name: 'Shapes' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('All shapes');
  });

  it('switches panels and reports the new value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs items={items} onValueChange={onValueChange} />, { wrapper: UiProvider });

    await user.click(screen.getByRole('tab', { name: 'Pins' }));

    expect(onValueChange).toHaveBeenCalledWith('pins');
    expect(screen.getByRole('tab', { name: 'Pins' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('All pins').hidden).toBe(false);
  });
});
