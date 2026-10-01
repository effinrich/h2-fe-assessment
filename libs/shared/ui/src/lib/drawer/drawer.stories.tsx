import { Button, Text } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen } from 'storybook/test';

import { Drawer } from './drawer';

const meta = {
  title: 'Overlay/Drawer',
  component: Drawer,
  args: {
    title: 'Layers',
    children: <Text>Every shape on the canvas, top to bottom.</Text>,
    trigger: <Button variant="outline">Open drawer</Button>,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    await expect(await screen.findByRole('dialog', { name: 'Layers' })).toBeVisible();
  },
};

export const Start: Story = {
  args: { placement: 'start' },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button>Apply</Button>
      </>
    ),
  },
};
