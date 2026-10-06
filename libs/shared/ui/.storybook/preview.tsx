import type { Preview } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UiProvider } from '../src/lib/provider/provider'

// A stub client for every story: no story touches the network, and Chromatic
// snapshots stay deterministic. retry:false so a deliberate error story fails
// fast rather than retrying under the camera.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false }
  }
})

const preview: Preview = {
  decorators: [
    Story => (
      <UiProvider>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </UiProvider>
    )
  ],
  parameters: {
    options: {
      autodocs: 'tag'
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i }
    },
    a11y: {
      test: 'error'
    },
    chromatic: {
      pauseAnimationAtEnd: true,
      delay: 300,
      diffThreshold: 0.5
    }
  }
}

export default preview
