# Run the gate and fix a red one

The gate is the check. A red gate is not a finished change.

```sh
bun run gate
```

That is `nx affected -t lint,format,typecheck,test,build,build-storybook,test-storybook`. It runs only projects your branch affects. CI runs the same command; git hooks are a fast path, not a replacement.

First time on a machine, install the browser the Storybook tests need:

```sh
bunx playwright install chromium
```

## Find which target failed

Run the failing target on its own, through Nx, for one project:

```sh
bunx nx run @h2-fe/pin:lint
```

Project names: `@h2-fe/web`, `@h2-fe/pin`, `@h2-fe/camera`, `@h2-fe/pdf-viewer`, `@h2-fe/web-ui`, `shared-ui`. For the targets a project really has, ask the graph:

```sh
bunx nx show project @h2-fe/pin
```

Do not read `project.json` and conclude a target is missing. Targets are inferred from plugins.

## Fix by target

| Target            | Meaning                                    | Fix                                                                                        |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `lint`            | oxlint with type-aware rules               | `bun run lint:fix` for fixable ones; otherwise edit. An illegal import is a tag violation. |
| `format`          | `oxfmt --check .` in the project           | `bun run format:fix`                                                                       |
| `typecheck`       | `tsc --build`; depends on upstream `build` | Fix the type error. For a third-party API, read the installed `.d.ts`.                     |
| `test`            | jsdom Vitest specs                         | Run the spec; fix code, not the test, unless the spec's criterion changed.                 |
| `build`           | Vite library or app build                  | Usually a typecheck or import problem; read the first error.                               |
| `build-storybook` | Static Storybook                           | A story fails to compile or import.                                                        |
| `test-storybook`  | Every story: render, play, axe             | See below.                                                                                 |

## When `test-storybook` is red

It runs each story in headless Chromium: render, `play` function, then an axe check at `error` level. Failure output names the story.

- **Play assertion failed.** The editor state differed from the spec. Run the one story with `-t` ([how](write-a-story-with-a-play-test.md#run-it)) and debug in `bun run storybook:web`.
- **Axe violation.** Fix the markup (label, contrast, role). Do not disable the check.
- **Browser missing.** Run `bunx playwright install chromium`.

## Pre-commit and pre-push hooks

`lefthook.yml` installs on `bun install` (skipped when `CI` is set):

- **pre-commit:** `oxlint --type-aware --fix`, then `oxfmt`, on staged files (re-staged), and `nx affected -t typecheck --uncommitted`.
- **pre-push:** `bun run gate`.

`LEFTHOOK=0 git commit ...` bypasses them. CI still runs the gate.

## Common traps

- **Root scripts.** `lint` and friends are `nx run-many`. The root `package.json` has `"nx": { "includedScripts": [] }` so they don't become targets on `@h2-fe/source`. Don't remove it.
- **Target names** are `lint` and `format`. `oxlint` and `oxfmt` are the binaries behind them, not targets.
- **Install at the root.** Run `bun install` from the repo root. Never `npm install` or `npx`.
- **Stale cache?** Nx caches by inputs. If a result looks wrong, rerun with `--skipNxCache` (`bunx nx run-many --help` lists it).
