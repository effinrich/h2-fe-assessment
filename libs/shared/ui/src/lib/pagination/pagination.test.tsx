import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('derives the pages from count and pageSize', () => {
    render(<Pagination count={30} pageSize={10} />, { wrapper: UiProvider });

    expect(screen.getByRole('button', { name: 'page 1' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'last page, page 3' })).toBeTruthy();
  });

  it('reports the new page from the next trigger and the page buttons', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination count={30} pageSize={10} defaultPage={1} onPageChange={onPageChange} />, {
      wrapper: UiProvider,
    });

    await user.click(screen.getByRole('button', { name: 'next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    await user.click(screen.getByRole('button', { name: 'last page, page 3' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });
});
