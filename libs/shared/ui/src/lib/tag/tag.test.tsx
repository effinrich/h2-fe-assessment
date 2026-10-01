import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Tag } from './tag';

describe('Tag', () => {
  it('has no remove button unless onClose is given', () => {
    render(<Tag>circle</Tag>, { wrapper: UiProvider });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls onClose from a labelled remove button', () => {
    const onClose = vi.fn();
    render(
      <Tag onClose={onClose} closeLabel="Remove circle">
        circle
      </Tag>,
      { wrapper: UiProvider },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove circle' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
