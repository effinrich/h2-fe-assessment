import { Button } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Drawer } from './drawer';

describe('Drawer', () => {
  it('opens from its trigger as a dialog named by its title', async () => {
    render(
      <Drawer title="Layers" trigger={<Button>Open</Button>}>
        Shapes
      </Drawer>,
      { wrapper: UiProvider },
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect((await screen.findByRole('dialog', { name: 'Layers' })).textContent).toContain('Shapes');
  });

  it('closes from the close button and reports the change', async () => {
    const onOpenChange = vi.fn();
    render(
      <Drawer title="Layers" defaultOpen onOpenChange={onOpenChange}>
        Shapes
      </Drawer>,
      { wrapper: UiProvider },
    );

    await screen.findByRole('dialog', { name: 'Layers' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
