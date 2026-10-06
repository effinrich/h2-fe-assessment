# 0014 — Chakra UI v3 over Tailwind

- Status: accepted
- Date: 2026-10-05
- Supersedes: [0004](0004-styling-and-primitives.md)

## Context

Most of the code here is written with an AI agent. AI-written styles fail in
predictable ways: invented spacing, colors and token names; raw pixel and hex
values that bypass the design system; utility classes that conflict silently,
with the winner determined by generated stylesheet order, not class-string
order. The browser accepts these conflicts without warning. The case is made in
[The case for compiled, typed CSS (blame AI)](https://dev.to/slafleche/the-case-for-compiled-typed-css-blame-ai-8m8):
TypeScript catches most of what AI gets wrong, but CSS has no compiler. The
deciding property is verification, not where the styles are written.

Tailwind is the default reflex, and the brief treats state-of-the-art AI output
as the baseline. Its class strings are checked by an editor plugin and a human
eye, not by the gate. Since v4, its tokens are authored as CSS (`@theme`),
outside the type system.

0004 chose Panda CSS + Ark UI via Park UI for that reason. It was replaced by
Chakra UI v3, which keeps the same model: Chakra v3 is built on Ark
(`@ark-ui/react` is a dependency), and its tokens, semantic tokens and recipes
follow Panda's API.

## Decision

**Chakra UI v3 for app chrome, with theme tokens and recipes.**

Why Chakra over Park UI + Panda:

- **Accessible components ready to use.** Dialog, file upload, toaster and the
  rest ship with Ark's behaviour and ARIA. Park UI has us copy each
  component in and own it.
- **Better represented in training data.** Ark and Park UI are thin there, so
  an agent invents APIs more often. Chakra's API is far more widely known,
  which leaves fewer plausible-but-wrong method names to catch.

Why typed styles over Tailwind:

- Styles are TypeScript: style props, `chakra()` factories and recipes. The
  intended vocabulary is our theme (`brand.solid`, `bg.canvas`, `fg.error` in
  `libs/shared/ui/src/lib/theme/system.ts`). Until `strictTokens` is on (see
  Consequences), props still accept free-form strings.
- A style prop has one value per property; Tailwind silently accepts conflicting
  utilities, whose winner follows generated stylesheet order and can contradict
  author intent.
- A token defined once in TypeScript is exported as a CSS variable, which is
  what the tldraw bridge reads (0013). There is no second copy to drift.

## Consequences

- **Runtime CSS, not compiled.** Chakra generates CSS at runtime through
  Emotion (`@emotion/react` is a peer dependency). The article argues for
  build-time output, and Panda gives that. We accepted the runtime cost for the
  two reasons above. Moving to Panda + Ark later is possible; Chakra's tokens
  and recipes already follow Panda's model.
- **Token checks must be switched on.** Without `strictTokens` and Chakra's
  typegen, a misspelled token or a raw value is just a string: `color="bran.fg"`
  and `padding="13px"` typecheck. A follow-up change enables both, so an
  off-system value is a type error and a deliberate one needs Chakra's
  escape-hatch syntax (`padding="[13px]"`), which stays visible in review.
- Chrome uses Chakra's attribute and recipe style, not utility soup. tldraw's
  internals are styled through its own CSS variables, never wrapped in
  `chakra()` (0013).
