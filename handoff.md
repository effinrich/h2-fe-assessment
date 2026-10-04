# h2-fe-assessment — handoff

Repo: `/Users/richtillman/Documents/GitHub/h2-fe-assessment`

## 1. State

| ref | commit | note |
|---|---|---|
| `origin/main` | `2676885` | PR #2 (design system, Storybook, routed viewer), PR #4 (viewer), PR #3 (CI) merged |
| local `main` | `origin/main` + `383f6d7` | fix commit — **UNPUSHED** |
| `origin/fixing-and-cleanup` | `886c36f` | 35 files vs main; unmerged |

Local `main` is 1 commit ahead. Nothing else outstanding.

## 2. Verified working

- `bun run gate` → **27/27**, run with `--skip-nx-cache`, so the results are real.
  Targets: `lint, format, typecheck, test, build, build-storybook`.
- Six Nx projects, each tagged `scope:*` + `type:*`; boundaries enforced by
  `@nx/enforce-module-boundaries` via `@nx/oxlint/boundaries-plugin` in the root `.oxlintrc.json`.
  One-way edges: `apps/web` → `libs/web/features/*` → `libs/web/ui` → `libs/shared/ui`.
- `libs/web/features/pdf-viewer` — 16 tests pass.
- Viewer driven in a real browser: example PDF opens, page 1 → 2 → 1 works, no console errors.

## 3. The plan — PDF viewer

| # | goal | status | where |
|---|---|---|---|
| 1 | Protect the user's marks — warn before losing them | done | `apps/web/src/app/routes/pdf-viewer-route.tsx` — native `<dialog>` on explicit exit; `beforeunload` while marks exist |
| 2 | Show `Page N of M` | done | `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx` |
| 3 | Previous / next + bounded page-jump field | done | same file; jump commits on submit only |
| 4 | Visible page-level loading | done | `libs/web/features/pdf-viewer/src/lib/pdf-viewer.tsx` |
| 5 | Page-level retry, distinct from document-level failure | done | same file |
| 6 | Filename in the top bar | done | `viewer-top-bar.tsx`, truncated |
| 7 | Accessible and usable at narrow widths | partial | wrap + live regions done; no 390/320px test, no keyboard test |
| 8 | Export, only when its meaning is honest | deferred | — |
| 9 | Validate before adding more chrome | deferred | — |

Supporting: rasterisation runs through `@tanstack/react-query`
(`libs/web/features/pdf-viewer/src/lib/hooks.ts`, keyed on a serialisation-safe file token);
placement is idempotent (`placePagesOnCanvas` — deterministic shape/asset ids, delete-before-create);
PDF page churn kept out of tldraw's Undo history.

Spec: `docs/specs/task-2-pdf.md` — criteria 1–4 ticked, each naming its test. Criterion 5 open.

## 4. Open defects

| severity | item |
|---|---|
| high | Chromatic CI builds **only** `shared-ui` (`.github/workflows/chromatic.yml`) — viewer stories never snapshotted. Needs a second Chromatic project token. |
| high | 98 Chromatic baselines pending acceptance. |
| medium | Top-bar controls are 32px — under the 44px touch guideline. |
| medium | Exit dialog is a native `<dialog>` with inline structural styles, not the design-system Modal. The route spec stubs `showModal`/`close`, so changing it means changing the spec. |
| medium | Story play functions execute only in a browser. The gate compiles stories but never runs them — two real failures hid there for weeks. |
| low | `tools/`, `docs/`, `.github/` sit outside every format target. |
| low | No pre-commit hook. `core.hooksPath` unset; lefthook not installed. |
| low | `.commandcode/taste/learned-taste/taste.md` is tracked and rewritten by the taste system — it repeatedly tripped "workspace not clean". |
| low | Dependabot alert open on the default branch. |

## 5. Traps already paid for

1. **oxfmt has no `extends` key.** `apps/web/.oxfmtrc.json` and `libs/shared/ui/.oxfmtrc.json`
   each held only `extends`. Removing them changed formatting across 84 files, so they were
   affecting output — the exact mechanism was never verified. Do not add a nested
   `.oxfmtrc.json` unless you inline the real settings.
2. **`nx g @nx/react:library`** re-adds its babel tooling (`@babel/core`, `@babel/preset-react`,
   `@nx/web`, `@swc/helpers`, `ajv`, `jiti`, `ts-node`, `typescript-eslint`, `@vitest/ui`) and
   always emits a `.babelrc`. It derives the package name from the **last segment of
   `--directory`** — `--directory=libs/web/ui` produced `@h2-fe/ui` and collided with `shared-ui`.
   Post-scaffold: delete `.babelrc`, strip the re-added deps, fix the name, add `nx.tags`.
3. **Task-graph cycles** appear if `libs/web/ui` lists feature libs in `implicitDependencies`
   while features import it. Keep the edge one-way.
4. **jsdom polyfills** required in `tools/vitest-setup.ts`: `matchMedia`, `ResizeObserver`,
   `scrollTo`, `HTMLImageElement.decode`, `FontFace`, `document.fonts` (including `add`).
   tldraw's FontManager and asset loader call all of them on mount.
5. **Repository rules** (`AGENTS.md`, "rules that do not bend"): verify every third-party call
   against the installed types; spec before code and a failing test first; never guess a CLI flag.

## 6. Commands

```bash
bun install                                  # root only; workspace package.json files hold no deps
bun run gate                                 # nx affected -t lint,format,typecheck,test,build,build-storybook
bunx nx run shared-ui:storybook              # shared stage — port 4400
bunx nx run @h2-fe/web-ui:storybook          # web stage    — port 6006
bun run storybook:web
bunx nx run-many -t test --skip-nx-cache     # force real runs, ignore Nx cache
git worktree list                            # any leftover QA sandboxes
```

## 7. Contents of `383f6d7` (local main, unpushed)

- Deleted the two `extends`-only oxfmt stubs; 84 files reformatted to the root config style.
- Viewer top bar: `color="fg"` (was near-invisible in dark mode), `flexWrap`, `zIndex` 400
  (tldraw panels are 300 and painted over it), themed Chakra `Input` replacing a raw `<input>`
  with an inline style.
- Loading state announced; document loading/error overlays block the canvas instead of
  allowing drawing on nothing; per-page live regions named.
- Error copy matches its actions and no longer duplicates the top bar's action.
- Home copy no longer claims marks persist; a failed example generation raises a toast
  instead of an unhandled rejection.
- Exit dialog: destructive action demoted, "Keep working" primary, `aria-describedby` wired.
- `AGENTS.md` root-`nx` claim corrected; `docs/decisions/0010` project list updated;
  root scripts `storybook:web` / `build-storybook:web` added.

Unpushed — droppable with `git reset --hard origin/main` if not wanted.

## 8. Artifacts left on this machine

- `~/.commandcode/worktrees/h2-qa-{code,ui,api,scope,critic}` — detached at `886c36f`.
  `code`, `ui`, `api` have `node_modules` installed (581 MB each).
  Remove: `git worktree remove --force <path>`
- Nx daemons may still be running from those worktrees.
