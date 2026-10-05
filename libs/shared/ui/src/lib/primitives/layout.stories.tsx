import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

import {
  Box,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Separator,
  SimpleGrid,
  Stack,
  VStack
} from "./layout"

const meta = {
  title: "Primitives/Layout"
} satisfies Meta

export default meta
type Story = StoryObj

function Tile({ children }: { children: ReactNode }) {
  return (
    <Box bg="brand.subtle" color="brand.fg" px="4" py="3" rounded="md" textAlign="center">
      {children}
    </Box>
  )
}

export const Stacks: Story = {
  render: () => (
    <Stack gap="6">
      <Stack gap="2">
        <Tile>Stack 1</Tile>
        <Tile>Stack 2</Tile>
      </Stack>
      <HStack gap="2">
        <Tile>HStack 1</Tile>
        <Tile>HStack 2</Tile>
      </HStack>
      <VStack gap="2" align="start">
        <Tile>VStack 1</Tile>
        <Tile>VStack 2</Tile>
      </VStack>
    </Stack>
  )
}

export const FlexRow: Story = {
  render: () => (
    <Flex justify="space-between" align="center" gap="4" wrap="wrap">
      <Tile>Start</Tile>
      <Tile>Middle</Tile>
      <Tile>End</Tile>
    </Flex>
  )
}

export const Grids: Story = {
  render: () => (
    <Stack gap="6">
      <Grid templateColumns={{ base: "1fr", md: "200px 1fr" }} gap="3">
        <GridItem>
          <Tile>Sidebar</Tile>
        </GridItem>
        <GridItem>
          <Tile>Main</Tile>
        </GridItem>
      </Grid>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="3">
        <Tile>One</Tile>
        <Tile>Two</Tile>
        <Tile>Three</Tile>
      </SimpleGrid>
    </Stack>
  )
}

export const ContainerAndCenter: Story = {
  render: () => (
    <Container maxW="md" borderWidth="1px" rounded="md" py="4">
      <Center h="24" bg="bg.muted" rounded="md">
        Centered in a container
      </Center>
    </Container>
  )
}

export const Separators: Story = {
  render: () => (
    <Stack gap="4">
      <Tile>Above</Tile>
      <Separator />
      <HStack gap="4" h="8">
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Right</span>
      </HStack>
    </Stack>
  )
}
