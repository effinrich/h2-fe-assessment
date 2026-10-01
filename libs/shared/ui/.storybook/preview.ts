import React from 'react'
import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Panda's layer order must be present before any styled-system class applies.
import '../src/styles.css'

// A stub client for every story: no story touches the network, and Chromatic
// snapshots stay deterministic. retry:false so a deliberate error story fails
// fast rather than retrying under the camera.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
  },
})

const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Story),
      ),
  ],
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
}

export default preview
