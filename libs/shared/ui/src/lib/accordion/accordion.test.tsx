import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Accordion } from './accordion';

const items = [
  { value: 'a', title: 'First', content: 'First body' },
  { value: 'b', title: 'Second', content: 'Second body' },
];

describe('Accordion', () => {
  it('opens an item and closes it again', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Accordion items={items} onValueChange={onValueChange} />, { wrapper: UiProvider });
    const trigger = screen.getByRole('button', { name: 'First' });

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(onValueChange).toHaveBeenLastCalledWith(['a']);

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });
});
