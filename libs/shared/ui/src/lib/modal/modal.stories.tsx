import { Button, Text } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen } from 'storybook/test';

import { Modal } from './modal';

const meta = {
  title: 'Overlay/Modal',
  component: Modal,
  args: {
    title: 'Delete shape',
    children: <Text>This removes the shape and every pin attached to it.</Text>,
    trigger: <Button variant="outline">Open modal</Button>,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open modal' }));
    await expect(await screen.findByRole('dialog', { name: 'Delete shape' })).toBeVisible();
  },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <>
        <Button variant="outline">Cancel</Button>
        <Button colorPalette="red">Delete</Button>
      </>
    ),
  },
};

export const Large: Story = {
  args: { size: 'lg' },
};
