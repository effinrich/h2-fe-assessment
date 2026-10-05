# Workspace map

Facts here come from `bunx nx show projects` and `bunx nx show project <name>`. When in doubt, ask the graph again; targets are inferred and config files do not list them all.

## Projects

| Project             | Root                           | Tags                        | Import as           |
| ------------------- | ------------------------------ | --------------------------- | ------------------- |
| `@h2-fe/web`        | `apps/web`                     | `scope:web`, `type:app`     | (app)               |
| `@h2-fe/pdf-viewer` | `libs/web/features/pdf-viewer` | `scope:web`, `type:feature` | `@h2-fe/pdf-viewer` |
| `@h2-fe/pin`        | `libs/web/features/pin`        | `scope:web`, `type:feature` | `@h2-fe/pin`        |
| `@h2-fe/camera`     | `libs/web/features/camera`     | `scope:web`, `type:feature` | `@h2-fe/camera`     |
| `@h2-fe/web-ui`     | `libs/web/ui`                  | `scope:web`, `type:ui`      | `@h2-fe/web-ui`     |
| `shared-ui`         | `libs/shared/ui`               | `scope:shared`, `type:ui`   | `@h2-fe/ui`         |
| `@h2-fe/source`     | `.` (repo root)                | none of ours                | no targets          |

Projects also carry an inferred `npm:public` or `npm:private` tag.

## Import rules

Enforced by `@nx/enforce-module-boundaries` in the root `.oxlintrc.json`:

| From           | May import                  |
| -------------- | --------------------------- |
| `scope:web`    | `scope:web`, `scope:shared` |
| `scope:shared` | `scope:shared`              |

Only the scope rule is lint-enforced. By convention, pin, camera and pdf-viewer do not import each other; only `apps/web` composes them ([ADR 0011](../decisions/0011-feature-pattern.md)).

## Targets

Present on every lib: `typecheck`, `build`, `lint`, `lint:fix`, `format`, `format:fix`, `test`.

Extra on `shared-ui` and `@h2-fe/web-ui`: `storybook`, `build-storybook`, `test-storybook`, `static-storybook`.

`@h2-fe/web` also has `serve`, `dev`, `preview`.

Run any target as `bunx nx run <project>:<target>`.

## Root scripts

| Script                             | Runs                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| `bun run start`                    | `nx serve @h2-fe/web`                                                            |
| `bun run build`                    | `nx build @h2-fe/web`                                                            |
| `bun run test`                     | `nx run-many -t test`                                                            |
| `bun run lint` / `lint:fix`        | `nx run-many -t lint` / `lint:fix`                                               |
| `bun run format` / `format:fix`    | `nx run-many -t format` / `format:fix`                                           |
| `bun run storybook`                | `nx run shared-ui:storybook`                                                     |
| `bun run storybook:web`            | `nx run @h2-fe/web-ui:storybook`                                                 |
| `bun run build-storybook` / `:web` | static builds of the two Storybooks                                              |
| `bun run gate`                     | `nx affected -t lint,format,typecheck,test,build,build-storybook,test-storybook` |

## Ports

| What                  | Port       | Source                                                    |
| --------------------- | ---------- | --------------------------------------------------------- |
| App (`bun run start`) | 4200       | `server.port` in `apps/web/vite.config.mts`               |
| `shared-ui` Storybook | 4400       | `storybook` target options, `libs/shared/ui/project.json` |
| Web stage Storybook   | none fixed | the CLI prints the URL                                    |

## Routes

| Path      | File                                           | Notes                                                 |
| --------- | ---------------------------------------------- | ----------------------------------------------------- |
| `/`       | `apps/web/src/app/routes/home`                 | Open PDF or use the example                           |
| `/viewer` | `apps/web/src/app/routes/pdf-viewer-route.tsx` | Lazy-loaded. Redirects home when there is no document |

## Tools and versions

Nx 23 and every `@nx/*` on one exact version (23.2.1). Bun is the package manager and runner; never `npm install` or `npx`. Vite 8, React 19, TypeScript 5.9 strict, Chakra UI 3, TanStack Query 5, tldraw 5.5, Storybook 10.6, Vitest 4.1, oxlint and oxfmt.

## Where config lives

| Concern                | File                                                            |
| ---------------------- | --------------------------------------------------------------- |
| Nx plugins, defaults   | `nx.json`                                                       |
| Lint rules, boundaries | root `.oxlintrc.json`; each project extends it                  |
| Formatter              | root `.oxfmtrc.json` (nested configs replace it, so none exist) |
| Git hooks              | `lefthook.yml`                                                  |
| CI                     | `.github/workflows/` (`ci.yml` runs the gate; `chromatic.yml`)  |
| Agent instructions     | `AGENTS.md` (root and per project)                              |
