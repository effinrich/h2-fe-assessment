import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { NativeSelect } from './native-select';

describe('NativeSelect', () => {
  it('accepts plain strings and option objects as items', () => {
    const onChange = vi.fn();
    render(
      <NativeSelect
        aria-label="Unit"
        placeholder="Choose a unit"
        items={['px', { value: 'pt', label: 'Points', disabled: true }]}
        onChange={onChange}
      />,
      { wrapper: UiProvider },
    );

    expect(screen.getByRole('option', { name: 'px' })).toHaveProperty('value', 'px');
    expect(screen.getByRole('option', { name: 'Points' })).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByRole('combobox', { name: 'Unit' }), { target: { value: 'px' } });
    expect(onChange).toHaveBeenCalled();
  });
});
