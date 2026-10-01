import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stat } from './stat';

const meta = {
  title: 'Data display/Stat',
  component: Stat,
  args: { label: 'Shapes imported', value: '1,284' },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithUnitAndHelpText: Story = {
  args: { label: 'Canvas size', value: '4.2', unit: 'MB', helpText: 'Since last export' },
};

export const TrendUp: Story = {
  args: { trend: { direction: 'up', value: '12%' }, helpText: 'vs. last week' },
};

export const TrendDown: Story = {
  args: { trend: { direction: 'down', value: '3%' }, helpText: 'vs. last week' },
};
