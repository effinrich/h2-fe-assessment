import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton, SkeletonCircle, SkeletonText, Spinner } from "./feedback";
import { HStack, Stack } from "./layout";

const meta = {
  title: "Primitives/Feedback",
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Spinners: Story = {
  render: () => (
    <HStack gap="6">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" color="brand.solid" />
    </HStack>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <Stack gap="4" maxW="sm">
      <HStack gap="4">
        <SkeletonCircle size="12" />
        <SkeletonText noOfLines={2} flex="1" />
      </HStack>
      <Skeleton height="32" />
    </Stack>
  ),
};
