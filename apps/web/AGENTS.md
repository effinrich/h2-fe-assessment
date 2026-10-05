# `@h2-fe/web`

Route host at `apps/web`. Home is `src/app/routes/home`, not a feature project. The viewer route composes `@h2-fe/pdf-viewer`, `@h2-fe/pin`, and `@h2-fe/camera`. Those three features must not import each other; this route is where they meet.

## Boundaries

Tags from `nx show project @h2-fe/web`: `scope:web`, `type:app`. Scope rules allow imports of `scope:web` and `scope:shared`. Do not import this app from `libs/shared/ui`.

## Targets

`nx show project @h2-fe/web` includes `serve`, `lint`, `test`, `typecheck`, and `build`. There is no Storybook target here. `serve` runs `vite` in this directory; `server.port` is 4200.

```sh
bunx nx run @h2-fe/web:serve
```
