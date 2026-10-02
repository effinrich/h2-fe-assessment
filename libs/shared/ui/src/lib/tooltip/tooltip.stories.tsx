import { Button } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen } from "storybook/test";

import { Tooltip } from "./tooltip";

const meta = {
  title: "Overlay/Tooltip",
  component: Tooltip,
  args: {
    content: "Pin two shapes together",
    children: <Button variant="outline">Pin tool</Button>,
    openDelay: 0,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole("button", { name: "Pin tool" }));
    await expect(await screen.findByText("Pin two shapes together")).toBeInTheDocument();
  },
};

export const WithArrow: Story = {
  args: { showArrow: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
