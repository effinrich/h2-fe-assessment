import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge, Card, List, Table } from "./data-display"
import { HStack, Stack } from "./layout"
import { Text } from "./typography"

const meta = {
  title: "Primitives/Data display"
} satisfies Meta

export default meta
type Story = StoryObj

export const Badges: Story = {
  render: () => (
    <HStack gap="2">
      <Badge>Default</Badge>
      <Badge colorPalette="green">Active</Badge>
      <Badge colorPalette="orange" variant="solid">
        Beta
      </Badge>
      <Badge colorPalette="red" variant="outline">
        Archived
      </Badge>
    </HStack>
  )
}

export const Cards: Story = {
  render: () => (
    <Card.Root maxW="sm">
      <Card.Header>
        <Card.Title>Importer</Card.Title>
        <Card.Description>Reads shapes from a source file.</Card.Description>
      </Card.Header>
      <Card.Body>
        <Text>Cards keep Chakra's slot API so header, body and footer compose freely.</Text>
      </Card.Body>
      <Card.Footer>
        <Badge colorPalette="green">Ready</Badge>
      </Card.Footer>
    </Card.Root>
  )
}

export const Lists: Story = {
  render: () => (
    <Stack gap="4">
      <List.Root ps="5">
        <List.Item>Unordered item</List.Item>
        <List.Item>Another item</List.Item>
      </List.Root>
      <List.Root as="ol" ps="5">
        <List.Item>First step</List.Item>
        <List.Item>Second step</List.Item>
      </List.Root>
    </Stack>
  )
}

const rows = [
  { id: 1, name: "shapes.json", size: "12 KB" },
  { id: 2, name: "pins.csv", size: "3 KB" }
]

export const Tables: Story = {
  render: () => (
    <Table.Root size="sm" maxW="md">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>File</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Size</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row) => (
          <Table.Row key={row.id}>
            <Table.Cell>{row.name}</Table.Cell>
            <Table.Cell textAlign="end">{row.size}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
