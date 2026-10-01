import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Switch } from './switch';

describe('Switch', () => {
  it('is labelled by its children and reports a boolean', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange}>Show grid</Switch>, { wrapper: UiProvider });

    await user.click(screen.getByText('Show grid'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
