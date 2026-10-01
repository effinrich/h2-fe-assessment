import { Button } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Modal } from './modal';

describe('Modal', () => {
  it('opens from its trigger as a dialog named by its title', async () => {
    render(
      <Modal title="Delete shape" trigger={<Button>Open</Button>}>
        This cannot be undone.
      </Modal>,
      { wrapper: UiProvider },
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = await screen.findByRole('dialog', { name: 'Delete shape' });
    expect(dialog.textContent).toContain('This cannot be undone.');
  });

  it('closes from the close button and reports the change', async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal title="Settings" defaultOpen onOpenChange={onOpenChange}>
        Body
      </Modal>,
      { wrapper: UiProvider },
    );

    await screen.findByRole('dialog', { name: 'Settings' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders footer content', async () => {
    render(
      <Modal title="Confirm" defaultOpen footer={<Button>Save</Button>}>
        Body
      </Modal>,
      { wrapper: UiProvider },
    );

    await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
