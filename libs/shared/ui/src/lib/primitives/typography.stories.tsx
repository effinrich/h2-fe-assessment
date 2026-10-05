import type { Meta, StoryObj } from "@storybook/react-vite"

import { FileText } from "lucide-react"

import { Stack } from "./layout"
import { Code, Heading, Icon, Kbd, Link, Text } from "./typography"

const meta = {
  title: "Primitives/Typography"
} satisfies Meta

export default meta
type Story = StoryObj

export const Headings: Story = {
  render: () => (
    <Stack gap="3">
      <Heading as="h1" size="3xl">
        Heading 3xl
      </Heading>
      <Heading as="h2" size="2xl">
        Heading 2xl
      </Heading>
      <Heading as="h3" size="xl">
        Heading xl
      </Heading>
      <Heading as="h4" size="lg">
        Heading lg
      </Heading>
    </Stack>
  )
}

export const Body: Story = {
  render: () => (
    <Stack gap="3" maxW="prose">
      <Text textStyle="lg">Large body text for introductions.</Text>
      <Text>
        Default body text with an inline <Link href="https://chakra-ui.com">link</Link> and a{" "}
        <Code>code</Code> snippet.
      </Text>
      <Text textStyle="sm" color="fg.muted">
        Small muted text for supporting detail.
      </Text>
      <Text textStyle="sm">
        Press <Kbd>P</Kbd> to pin, <Kbd>C</Kbd> to export an area.
      </Text>
      <Text textStyle="sm">
        <Icon asChild boxSize="4" mr="1" verticalAlign="text-bottom">
          <FileText aria-hidden />
        </Icon>
        An icon sized and coloured by tokens.
      </Text>
    </Stack>
  )
}
