import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { NumberInput } from "./number-input";

const meta = {
  title: "Forms/NumberInput",
  component: NumberInput,
  args: {
    label: "Stroke width",
    defaultValue: "2",
    min: 0,
    max: 10,
    width: "40",
    onValueChange: fn(),
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole("spinbutton", { name: "Stroke width" });
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    await expect(args.onValueChange).toHaveBeenLastCalledWith(5, "5");
  },
};

export const WithStep: Story = {
  args: { step: 0.5, formatOptions: { minimumFractionDigits: 1 } },
};

export const Disabled: Story = {
  args: { disabled: true },
};
