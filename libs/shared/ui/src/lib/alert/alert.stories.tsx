import { Button, Stack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert } from "./alert";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  args: { title: "Import finished", children: "42 shapes were added to the canvas." },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Statuses: Story = {
  render: (args) => (
    <Stack gap="3">
      <Alert {...args} status="info" title="Info" />
      <Alert {...args} status="success" title="Success" />
      <Alert {...args} status="warning" title="Warning" />
      <Alert {...args} status="error" title="Error" />
    </Stack>
  ),
};

export const TitleOnly: Story = {
  args: { children: undefined, status: "warning", title: "Unsaved changes" },
};

export const WithAction: Story = {
  args: {
    status: "error",
    title: "Import failed",
    children: "The file could not be parsed.",
    action: (
      <Button size="sm" variant="outline" alignSelf="center">
        Retry
      </Button>
    ),
  },
};
