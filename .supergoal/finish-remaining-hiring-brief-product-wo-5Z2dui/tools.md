# Tools available this session

- **Context7** — `plugin-oh-my-claude-context7` + `plugin-context7` (`resolve-library-id`, `query-docs`). Use before any new tldraw / Chakra API call.
- **WebSearch / WebFetch** — Cursor native. Optional; prefer Context7 + installed types.
- **Nx MCP** — `plugin-nx-nx-mcp` / `user-nrwl.angular-console-extension-nx-mcp` (`nx_docs`). Ask the graph; do not infer targets from `project.json`.
- **Browser** — `cursor-ide-browser`, Playwright MCP, Chrome DevTools. Required for UI phases.
- **Ultrawork Task** — Cursor `Task` with explicit `model`. `docs/shared/agent-tiers.md` was **not found** in the OMC cache; route by complexity instead (Haiku lookups, Sonnet impl, Opus analysis).
- **Not used** — Convex, Netlify, Vercel, Stripe, Clerk. This repo has no backend.

Feature stories (`camera`, `pin`, `pdf-viewer`) execute via `@h2-fe/web-ui:test-storybook`, not the feature project's `test` target.
