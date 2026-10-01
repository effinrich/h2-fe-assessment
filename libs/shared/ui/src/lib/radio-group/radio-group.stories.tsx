import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { RadioGroup } from './radio-group';

const meta = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
  args: {
    label: 'Export format',
    defaultValue: 'png',
    items: [
      { value: 'png', label: 'PNG' },
      { value: 'svg', label: 'SVG' },
      { value: 'pdf', label: 'PDF', disabled: true },
    ],
    onValueChange: fn(),
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('SVG'));
    await expect(args.onValueChange).toHaveBeenCalledWith('svg');
  },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};
