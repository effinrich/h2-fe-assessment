import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Breadcrumb } from "./breadcrumb";

const meta = {
  title: "Navigation/Breadcrumb",
  component: Breadcrumb,
  args: {
    items: [
      { label: "Projects", href: "#projects" },
      { label: "Floor plan", href: "#floor-plan" },
      { label: "Layer 2" },
    ],
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Layer 2")).toHaveAttribute("aria-current", "page");
  },
};

export const CustomSeparator: Story = {
  args: { separator: "/" },
};

export const Large: Story = {
  args: { size: "lg" },
};
