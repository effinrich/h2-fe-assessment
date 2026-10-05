import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge, Box, Button, Heading, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react"

import { UiProvider } from "./provider"

const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]
const roles = ["solid", "contrast", "fg", "subtle", "muted", "emphasized", "focusRing", "border"]

// The Storybook decorator already wraps every story in UiProvider; this story
// documents what that provider's theme resolves to.
const meta = {
  title: "Theme/UiProvider",
  component: UiProvider,
  args: { children: null }
} satisfies Meta<typeof UiProvider>

export default meta
type Story = StoryObj<typeof meta>

export const BrandPalette: Story = {
  render: () => (
    <Stack gap="8">
      <Stack gap="3">
        <Heading size="md">brand scale</Heading>
        <SimpleGrid columns={{ base: 4, md: 11 }} gap="2">
          {shades.map((shade) => (
            <Stack key={shade} gap="1">
              <Box h="12" rounded="md" bg={`brand.${shade}`} borderWidth="1px" />
              <Text textStyle="xs" color="fg.muted">
                {shade}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Stack>
      <Stack gap="3">
        <Heading size="md">brand roles (adapt to colour mode)</Heading>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="2">
          {roles.map((role) => (
            <Stack key={role} gap="1">
              <Box h="12" rounded="md" bg={`brand.${role}`} borderWidth="1px" />
              <Text textStyle="xs" color="fg.muted">
                {role}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Stack>
      <Stack gap="3">
        <Heading size="md">default colorPalette is brand</Heading>
        <HStack gap="3" flexWrap="wrap">
          <Button>Solid</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge>Badge</Badge>
        </HStack>
      </Stack>
    </Stack>
  )
}
