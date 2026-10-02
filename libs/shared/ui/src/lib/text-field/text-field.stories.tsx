import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { TextField } from "./text-field";

const meta = {
  title: "Forms/TextField",
  component: TextField,
  args: { label: "Email", placeholder: "you@example.com", type: "email" },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText("Email");
    await userEvent.type(input, "ada@example.com");
    await expect(input).toHaveValue("ada@example.com");
  },
};

export const WithHelperText: Story = {
  args: { helperText: "We'll never share your email." },
};

export const Invalid: Story = {
  args: { errorText: "Enter a valid email address.", defaultValue: "ada@" },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  },
};

export const Required: Story = {
  args: { required: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "ada@example.com" },
};
