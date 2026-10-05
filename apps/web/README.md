# `@h2-fe/web`

The route host. Home is `src/app/routes/home` (`/`). The viewer is `src/app/routes/pdf-viewer-route/pdf-viewer-route.tsx` (`/viewer`). This app composes pin and camera onto the PDF viewer. It is not a feature library.

Tags: `scope:web`, `type:app`. It may import `scope:web` and `scope:shared`. It must not be imported by `libs/shared/ui`.

From the repo root:

```sh
bunx nx run @h2-fe/web:serve
bunx nx run @h2-fe/web:lint
bunx nx run @h2-fe/web:test
bunx nx run @h2-fe/web:typecheck
bunx nx run @h2-fe/web:build
```

`serve` runs Vite in this directory. Dev server port is 4200 (`vite.config.mts`). `bun run start` at the repo root is this serve target.
