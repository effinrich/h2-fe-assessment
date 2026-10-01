import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UiProvider } from '../provider/provider';
import { RadioGroup } from './radio-group';

const items = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
  { value: 'pdf', label: 'PDF', disabled: true },
];

describe('RadioGroup', () => {
  it('renders one radio per item and reports the selected value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup label="Format" items={items} defaultValue="png" onValueChange={onValueChange} />, {
      wrapper: UiProvider,
    });

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect((screen.getByRole('radio', { name: 'PNG' }) as HTMLInputElement).checked).toBe(true);

    await user.click(screen.getByText('SVG'));
    expect(onValueChange).toHaveBeenCalledWith('svg');
  });

  it('disables items marked disabled', () => {
    render(<RadioGroup items={items} />, { wrapper: UiProvider });
    expect((screen.getByRole('radio', { name: 'PDF' }) as HTMLInputElement).disabled).toBe(true);
  });
});
