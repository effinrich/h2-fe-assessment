import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Progress } from "./progress";

const meta = {
  title: "Feedback/Progress",
  component: Progress,
  args: { label: "Uploading", value: 40, showValueText: true, maxW: "sm" },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  },
};

export const Indeterminate: Story = {
  args: { value: null, showValueText: false },
};

export const Striped: Story = {
  args: { striped: true, animated: true, value: 65 },
};
