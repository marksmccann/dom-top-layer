# AGENTS.md

## Project Overview

- `dom-top-layer` is a framework-agnostic TypeScript library for tracking browser top-layer state.
- Source code lives in `src/`.
- Public exports are collected in `src/index.ts`.
- Build output is generated into `dist/` and should not be edited manually.

## Environment

- Use Node.js 18 or newer.
- Package manager: `npm`.
- The package should remain framework-agnostic unless a task explicitly asks for an adapter layer.

## Important Commands

- Install dependencies: `npm install`
- Build the library: `npm run build`
- Run the watch build for development: `npm run dev`
- Run tests once: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run linting: `npm run lint`
- Run TypeScript checks: `npm run typecheck`
- Format the repo: `npm run format`
- Create a commit: `npm run commit`

## Validation

- After code changes, run the checks that match the scope of the change.
- Preferred full validation for library code changes:
    - `npm run lint`
    - `npm run typecheck`
    - `npm test`
- If public API behavior changes, update or add tests in `src/*.test.ts`.
- If the exported surface or user-facing behavior changes, update `README.md` and `llms.txt`.

## Codebase Conventions

- Follow the existing formatting style:
    - double quotes
    - semicolons
    - four-space indentation
- Keep the root package small and focused.
- Prefer adding internal utilities before expanding the public API.
- Do not introduce framework-specific APIs into the core package without explicit direction.

## Change Guidance

- Keep changes minimal and scoped to the request.
- Do not edit generated output in `dist/`.
- Do not manually update `CHANGELOG.md` for routine feature work unless explicitly asked.
- When creating a commit, use `npm run commit` instead of invoking `git commit` directly.
