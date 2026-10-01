import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { Switch } from './switch';

const meta = {
  title: 'Forms/Switch',
  component: Switch,
  args: { children: 'Show grid', onCheckedChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Show grid'));
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true);
  },
};

export const On: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
