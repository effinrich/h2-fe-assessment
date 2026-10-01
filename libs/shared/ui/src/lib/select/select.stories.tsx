import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen } from 'storybook/test';

import { Select } from './select';

const meta = {
  title: 'Forms/Select',
  component: Select,
  args: {
    label: 'Stroke',
    placeholder: 'Pick a stroke',
    width: '64',
    items: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted', disabled: true },
    ],
    onValueChange: fn(),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('combobox', { name: 'Stroke' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Dashed' }));
    await expect(args.onValueChange).toHaveBeenCalledWith(['dashed']);
  },
};

export const Multiple: Story = {
  args: { multiple: true, defaultValue: ['solid', 'dashed'] },
};

export const Disabled: Story = {
  args: { disabled: true },
};
