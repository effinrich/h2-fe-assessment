import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UiProvider } from '../provider/provider';
import { Avatar } from './avatar';

describe('Avatar', () => {
  it('falls back to initials derived from the name', () => {
    render(<Avatar name="Ada Lovelace" />, { wrapper: UiProvider });
    expect(screen.getByText('AL')).toBeTruthy();
  });

  it('only renders an image when given a source', () => {
    const { rerender } = render(<Avatar name="Ada Lovelace" />, { wrapper: UiProvider });
    expect(document.querySelector('img')).toBeNull();

    rerender(<Avatar name="Ada Lovelace" src="/ada.png" />);
    expect(document.querySelector('img')?.getAttribute('alt')).toBe('Ada Lovelace');
  });
});
