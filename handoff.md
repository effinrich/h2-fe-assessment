# Handoff 2026-10-05

## Stop

These are the AGENTS.md bullets read this turn (Learned User Preferences):

- If you are not sure, say I don't know and stop. Do not guess. Do not open the app. Do not edit. Do not delegate.
- Do not change, create, or delete a file unless I name that file and write: edit now.
- Do not commit or push unless I write: commit now.

A fourth bullet about unchecked claims is not in that file. The nearest line there is: An honest "I don't know" is accepted and encouraged when something was not verified.

The chat rule that is not in the file: if you did not check it this turn, say I don't know; if you changed it, say so; do not deny it; do not argue a false claim.

## Do not

- Do not hide, cover, clip, or remove tldraw Menu, undo, redo, delete, or the style panel. The user said those controls are required. Task 2 does not say they are unimportant. Task 2 asks for filename, page count, previous, next, and a jump field, and says not to duplicate tldraw tool and zoom controls and not to cover the style panel.
- Customizing existing UI is not adding new UI. Do not add a bar, overlay, or widget.
- Do not claim the camera is on screen. The user could not see one. The code has a camera feature. Visibility was not fixed. Do not tell the user to record or send docs/reviewer.md as if the camera is visible.
- Do not start another bun run start. One may already be running.
- Do not stage .gitignore, .vscode, .github/agents, .supergoal, ai-guardrails.md, or docs zips.
- Only change a file the user names, and only after they write: edit now. Only commit after they write: commit now.

## What happened

These are reports from 2026-10-05. This turn did not re-prove them, except the git facts below.

A Chakra page bar was stacked on tldraw's top-left row, so button tips stayed visible and clickable. The user told agents to stop. Further chrome redesign was forbidden.

An agent reported adding a 1px page stroke in libs/web/features/pdf-viewer/src/lib/tldraw-theme.css, on commit 1c29fc4 on fixing-and-cleanup, and reported that the push was rejected by shared-ui test-storybook (Brand Palette contrast). Git this turn shows 1c29fc4 as the latest commit, message "Give PDF pages a 1px edge so the sheet reads against the canvas.", on branch fixing-and-cleanup. This turn did not open that CSS file and did not re-check the push. I don't know the file path or the rejection from this turn.

The user saw the screen change and was told nothing was touched. That denial was false.

transcript-10-5-2026.md is a short summary the user rejected. transcript-10-5-2026-v2.md is the start/gate dialogue.

## Git now

Branch: fixing-and-cleanup.

Last commits from `git log -8 --oneline` this turn:

- 1c29fc4 Give PDF pages a 1px edge so the sheet reads against the canvas.
- 535cb63 Group camera files by concern so the extension entry sits next to its stories, and name the public barrel exports.
- c4698f2 Document how to run the app, Storybook, and Chromatic, and add each project's notes.
- 4144a3f Include web-stage stories in the Storybook Chromatic publishes.
- ecba346 Add a five-minute reviewer walkthrough the hiring email can point at.
- 1514835 Move the open-document screen onto the home route.
- ff816c7 Polish the hiring zip: finish camera criteria, retoken the palette, and write a reviewer README.
- 1a182e1 feat(pin,camera): ship attach tool and crop-frame export

The tree is dirty. Do not clean it. Paths from `git status --short` this turn:

- M .gitignore
- M .vscode/settings.json
- M AGENTS.md
- M ai-guardrails.md
- ?? .github/agents/
- ?? .supergoal/
- ?? transcript-10-5-2026-v2.md
- ?? transcript-10-5-2026.md

handoff.md was not in that status. This file is the one change from this turn.

## If they ask for product work

Follow docs/specs to the letter. Read the spec before editing. Say I don't know when you have not checked. Stop when told to stop.
