import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Pagination } from "./pagination";

const meta = {
  title: "Navigation/Pagination",
  component: Pagination,
  args: { count: 120, pageSize: 10, defaultPage: 1, onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "next page" }));
    await expect(args.onPageChange).toHaveBeenCalledWith(2);
  },
};

export const FewPages: Story = {
  args: { count: 30 },
};

export const Large: Story = {
  args: { buttonSize: "md", siblingCount: 2, defaultPage: 6 },
};
