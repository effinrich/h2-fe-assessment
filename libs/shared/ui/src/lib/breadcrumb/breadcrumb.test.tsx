import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Breadcrumb } from './breadcrumb';

describe('Breadcrumb', () => {
  it('links every item except the last, which is marked as the current page without an href', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Projects', href: '/projects' },
          { label: 'Floor plan', href: '/projects/1' },
          { label: 'Layer 2', href: '/ignored' },
        ]}
      />,
      { wrapper: UiProvider },
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/projects', '/projects/1', null]);
    expect(screen.getByRole('link', { name: 'Layer 2' }).getAttribute('aria-current')).toBe('page');
  });
});
