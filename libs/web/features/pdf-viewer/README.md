# `@h2-fe/pdf-viewer`

Places a PDF on a tldraw canvas and owns the viewer screen. The viewer route in `apps/web` hosts it and passes pin and camera in.

Tags: `scope:web`, `type:feature`. Do not import `@h2-fe/pin` or `@h2-fe/camera`.

This project has no Storybook target. Its stories are included by `shared-ui` and `@h2-fe/web-ui`.

From the repo root:

```sh
bunx nx run @h2-fe/pdf-viewer:lint
bunx nx run @h2-fe/pdf-viewer:test
bunx nx run @h2-fe/pdf-viewer:typecheck
bunx nx run @h2-fe/pdf-viewer:build
```
