import type { Meta, StoryObj } from '@storybook/react-vite';

import { SunIcon } from '../color-mode-button/partials/sun-icon';
import { ButtonGroup, CloseButton, IconButton } from './buttons';
import { HStack, Stack } from './layout';

const meta = {
  title: 'Primitives/Buttons',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const IconButtons: Story = {
  render: () => (
    <HStack gap="3">
      <IconButton aria-label="Brightness" variant="solid">
        <SunIcon />
      </IconButton>
      <IconButton aria-label="Brightness" variant="outline">
        <SunIcon />
      </IconButton>
      <IconButton aria-label="Brightness" variant="ghost">
        <SunIcon />
      </IconButton>
      <CloseButton aria-label="Close" />
    </HStack>
  ),
};

export const Groups: Story = {
  render: () => (
    <Stack gap="4">
      <ButtonGroup size="sm" variant="outline">
        <IconButton aria-label="Brightness">
          <SunIcon />
        </IconButton>
        <CloseButton aria-label="Close" />
      </ButtonGroup>
      <ButtonGroup size="sm" variant="outline" attached>
        <IconButton aria-label="Brightness">
          <SunIcon />
        </IconButton>
        <CloseButton aria-label="Close" />
      </ButtonGroup>
    </Stack>
  ),
};
