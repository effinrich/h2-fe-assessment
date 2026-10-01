import type { Meta, StoryObj } from '@storybook/react-vite';
import { H2FeUi  } from './ui';
import { expect } from 'storybook/test';

const meta = {
  component: H2FeUi,
  title: 'H2FeUi',
} satisfies Meta<typeof H2FeUi>;
export default meta;

type Story = StoryObj<typeof H2FeUi>;

export const Primary = {
  args: {
  },
} satisfies Story;

export const Heading = {
  args: {
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/H2FeUi/gi)).toBeTruthy();
  },
} satisfies Story;

