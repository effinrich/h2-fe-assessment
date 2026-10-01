import { Button, Input, Text } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen } from 'storybook/test';

import { Popover } from './popover';

const meta = {
  title: 'Overlay/Popover',
  component: Popover,
  args: {
    trigger: (
      <Button variant="outline" size="sm">
        Shape details
      </Button>
    ),
    title: 'Rectangle',
    children: <Text textStyle="sm">120 × 80 px, 3 pins attached.</Text>,
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Shape details' }));
    await expect(await screen.findByRole('dialog', { name: 'Rectangle' })).toBeVisible();
  },
};

export const WithArrow: Story = {
  args: { showArrow: true },
};

export const WithForm: Story = {
  args: {
    title: 'Rename shape',
    children: <Input size="sm" placeholder="New name" />,
    footer: <Button size="sm">Save</Button>,
  },
};
