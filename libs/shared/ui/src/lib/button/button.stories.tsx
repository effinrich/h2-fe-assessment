import { HStack } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Button } from "./button";

const meta = {
  title: "Buttons/Button",
  component: Button,
  args: { children: "Save shape", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Save shape" }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Variants: Story = {
  render: (args) => (
    <HStack gap="3">
      <Button {...args} variant="solid">
        Solid
      </Button>
      <Button {...args} variant="subtle">
        Subtle
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </HStack>
  ),
};

export const Loading: Story = {
  args: { loading: true, loadingText: "Saving" },
};

export const Danger: Story = {
  args: { colorPalette: "red", children: "Delete shape" },
};
