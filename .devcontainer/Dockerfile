FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install Bun system-wide
ENV BUN_INSTALL=/usr/local
RUN curl -fsSL https://bun.sh/install | bash

# Install Playwright system dependencies for Chromium (used by Storybook test runner)
RUN npx playwright install-deps chromium
