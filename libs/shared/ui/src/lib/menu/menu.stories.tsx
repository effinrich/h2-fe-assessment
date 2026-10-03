import { Button } from "@chakra-ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";

import { Menu } from "./menu";

const meta = {
  title: "Overlay/Menu",
  component: Menu,
  args: {
    trigger: (
      <Button variant="outline" size="sm">
        Actions
      </Button>
    ),
    items: [
      { value: "rename", label: "Rename", command: "⌘R" },
      { value: "duplicate", label: "Duplicate", command: "⌘D" },
      { value: "export", label: "Export", disabled: true },
      { value: "delete", label: "Delete", danger: true },
    ],
    onSelect: fn(),
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: /Rename/ }));
    await expect(args.onSelect).toHaveBeenCalledWith("rename");
  },
};

export const PlacedEnd: Story = {
  args: { positioning: { placement: "bottom-end" } },
};
