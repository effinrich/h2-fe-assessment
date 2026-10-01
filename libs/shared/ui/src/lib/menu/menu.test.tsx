import { Button } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Menu } from './menu';

const items = [
  { value: 'rename', label: 'Rename' },
  { value: 'delete', label: 'Delete', danger: true },
];

describe('Menu', () => {
  it('opens from its trigger and reports the selected value', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Menu trigger={<Button>Actions</Button>} items={items} onSelect={onSelect} />, { wrapper: UiProvider });

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    // Press and release in place: under jsdom, the pointer move that `user.click` sends first stops Zag selecting the item.
    const item = await screen.findByRole('menuitem', { name: 'Delete' });
    await user.pointer({ target: item, keys: '[MouseLeft>]' });
    await user.pointer({ target: item, keys: '[/MouseLeft]' });

    expect(onSelect).toHaveBeenCalledWith('delete');
  });
});
