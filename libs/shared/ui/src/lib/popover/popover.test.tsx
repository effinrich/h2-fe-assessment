import { Button } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Popover } from './popover';

describe('Popover', () => {
  it('opens from its trigger as a dialog named by its title and reports open changes', async () => {
    const onOpenChange = vi.fn();
    render(
      <Popover trigger={<Button>Details</Button>} title="Rectangle" onOpenChange={onOpenChange}>
        120 × 80 px
      </Popover>,
      { wrapper: UiProvider },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    const dialog = await screen.findByRole('dialog', { name: 'Rectangle' });
    expect(dialog.textContent).toContain('120 × 80 px');
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
  });
});
