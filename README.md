# toplayer

`toplayer` is a framework-agnostic TypeScript library for tracking which elements are currently active in the browser's top layer and for reacting to changes over time.

The package is being set up to support two core goals:

- inspect the current top-layer stack and its order
- subscribe to top-layer changes without binding the API to a specific framework

## Status

This repository currently contains the package infrastructure and a minimal public entrypoint so the project can be built, tested, and published while the runtime API is designed.

## Why This Package?

Modern browsers expose several features that participate in the top layer, such as dialogs, popovers, and fullscreen elements. What browsers do not currently provide is a first-class, framework-agnostic way to inspect the active top-layer stack or subscribe to changes in that stack.

`toplayer` is intended to fill that gap with a small, focused browser utility that can later power framework adapters, hooks, or application-specific integrations without making those choices part of the core package.

## Installation

```bash
npm install toplayer
```

## Development

```bash
npm install
npm run build
npm test
```

## Planned Direction

- framework-agnostic top-layer inspection primitives
- subscription APIs for top-layer changes
- browser-focused behavior with TypeScript-first ergonomics

## License

MIT
