# Add a feature lib

A feature is a capability you can name and ship (pin, camera, the PDF viewer). A route is a host and may compose many features. If your work is a new capability, make a lib. If it is a new page, add a route in `apps/web` and put reusable capabilities in libs. See [Architecture](../explanation/architecture.md).

Never create the folder by hand. A hand-made folder is not in the project graph, so `nx affected` skips it and tags never apply.

## 1. Spec first

Copy `docs/specs/TEMPLATE.md` to `docs/specs/<task>.md` and write falsifiable acceptance criteria. See [Specs](../specs/README.md).

## 2. Generate the lib

From the repo root:

```sh
bunx nx g @nx/react:lib <name> --directory=libs/web/features/<name> --tags=scope:web,type:feature
```

Preview first with `--dry-run`. If a flag is unfamiliar, check `bunx nx g @nx/react:lib --help`; do not guess.

Tags are mandatory. `scope:web` may import `scope:web` and `scope:shared`; `scope:shared` may import only `scope:shared`. An illegal import fails `lint`.

## 3. Check what the generator did

The generator can touch files outside the new folder (root `package.json`, `nx.json`, tsconfig files). Read `git diff` before accepting it. Dependencies live only in the root `package.json`; the lib's `package.json` lists none.

Then ask the graph, not the config files:

```sh
bunx nx show project @h2-fe/<name>
```

You should see `lint`, `typecheck`, `test`, `build` and the `scope:web`, `type:feature` tags. If a name is missing, find out why before moving on. Targets are inferred from plugins, so a sparse `project.json` proves nothing.

## 4. Match the existing feature libs

Compare against `libs/web/features/pin`. The generated defaults differ in places that matter here:

- `.oxlintrc.json` is `{ "extends": ["../../../../.oxlintrc.json"] }`. Do not add an `.oxfmtrc.json`: oxfmt has no `extends`, so a nested one replaces the root config.
- `package.json` has an `nx.targets` block for `lint` (`args: ["--type-aware"]`), `format`, `format:fix` and `lint:fix`.
- `tsconfig.lib.json` references `../../../shared/ui/tsconfig.lib.json` when the lib imports `@h2-fe/ui`.
- `vite.config.mts` lists `react`, `react-dom`, `react/jsx-runtime`, `tldraw`, `lucide-react` and `@h2-fe/ui` as `rolldownOptions.external`, and its `test` block sets `setupFiles: ["../../../../tools/vitest-setup.ts"]` for jsdom.

## 5. Lay out the lib

Under `src/lib/`, one file per concern: `types.ts`, `consts.ts`, `utils.ts`, and so on. The public API is `src/index.ts` only, and consumers import it as `@h2-fe/<name>`. Do not deep-import.

Feature libs must not import each other. Only `apps/web` composes them. This is a convention from [ADR 0011](../decisions/0011-feature-pattern.md); the lint rule enforces scopes, not this.

## 6. Test it

Stories with play functions are the component tests: [Write a story with a play test](write-a-story-with-a-play-test.md). Pure logic gets a colocated `*.spec.ts` (jsdom Vitest).

## 7. Run the gate

```sh
bun run gate
```

See [Run the gate and fix a red one](run-the-gate-and-fix-a-red-one.md).

If your lib is a canvas extension, continue with [Add a canvas extension to the viewer](add-a-canvas-extension-to-the-viewer.md).
