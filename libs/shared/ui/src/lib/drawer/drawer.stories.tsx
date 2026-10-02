import { Button, Text } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor, waitForElementToBeRemoved } from 'storybook/test';

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
    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' } , { container: 'document.body' }));
    const dialog = await screen.findByRole('dialog', { name: 'Layers' });

    await waitFor(() => expect(dialog).toBeVisible());

    await userEvent.click(screen.getByRole('button', { name: 'Close' },{ container: 'document.body' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog', { name: 'Layers' }));
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
