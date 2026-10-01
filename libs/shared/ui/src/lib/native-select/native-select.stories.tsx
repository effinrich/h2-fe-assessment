import { Field } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { NativeSelect } from './native-select';

const meta = {
  title: 'Forms/NativeSelect',
  component: NativeSelect,
  args: {
    'aria-label': 'Unit',
    items: ['px', 'rem', { value: 'pt', label: 'pt (print)', disabled: true }],
  },
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole('combobox', { name: 'Unit' });
    await userEvent.selectOptions(select, 'rem');
    await expect(select).toHaveValue('rem');
  },
};

export const WithPlaceholder: Story = {
  args: { placeholder: 'Choose a unit' },
};

export const InField: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <Field.Root maxW="xs">
      <Field.Label>Unit</Field.Label>
      <NativeSelect {...args} />
    </Field.Root>
  ),
};

export const Invalid: Story = {
  args: { invalid: true },
};
