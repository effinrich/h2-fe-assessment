import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('is labelled by its children and reports the new checked state', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange}>Accept terms</Checkbox>, { wrapper: UiProvider });

    await user.click(screen.getByText('Accept terms'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect((screen.getByRole('checkbox', { name: 'Accept terms' }) as HTMLInputElement).checked).toBe(true);
  });
});
