# dom-top-layer

`dom-top-layer` is a framework-agnostic TypeScript library for tracking which elements are currently active in the browser's top layer and for reacting to changes over time.

## Why?

Modern browsers expose several features that participate in the top layer, such as `dialog` and `popover` elements. What browsers do not currently provide is a first-class, framework-agnostic way to inspect the active top-layer stack or to subscribe to changes in that stack.

`dom-top-layer` is intended to fill that gap with a small, focused browser utility that can later power framework adapters, hooks, or application-specific integrations without making those choices part of the core package.

## Who Is This For?

`dom-top-layer` is useful when you need to inspect or coordinate browser-managed layered UI without tying that logic to a specific framework.

Examples include:

- coordinating dismiss behavior across popovers, dialogs, and other layered UI
- deciding which top-layer element should handle escape-key or outside-click dismissal first
- building overlay managers for design systems or application shells
- styling layered UI based on stack position using DOM attributes
- writing tests that need to assert top-layer state directly from the DOM
- building framework adapters or hooks on top of a framework-agnostic core
- debugging complex top-layer interactions during development

## How It Works

`dom-top-layer` helps you inspect and react to browser top-layer state in a framework-agnostic way.

At a high level, the controller:

- connects to a `Document` or `ShadowRoot`
- listens for DOM mutations and top-layer lifecycle events
- detects which supported elements are currently active
- writes their inferred stack order back to the DOM as `data-top-layer-index`
- emits enter and exit events when that ordered stack changes

The controller reflects observed browser lifecycle ordering and is designed to stay synchronized with browser-managed top-layer state. It writes stack position into the DOM so that CSS, testing tools, framework adapters, and other external consumers can inspect the current state without needing direct access to the controller instance. For consumers that need to react to changes over time, `subscribe()` provides a convenient subscription layer on top of that DOM-backed state.

## Installation

```bash
npm install dom-top-layer
```

## Quick Start

```ts
import { TopLayerController } from "dom-top-layer";

const controller = new TopLayerController({
    attributeName: "data-top-layer-index"
});

const unsubscribe = controller.subscribe((event) => {
    if (event.type === "enter") {
        console.log("entered", event.target, event.index);
    }

    if (event.type === "exit") {
        console.log("exited", event.target);
    }

    console.log(event.elements);
});

controller.connect(document);

const elements = controller.getElements();
const topElement = controller.getTopElement();

unsubscribe();
controller.disconnect();
```

## How To Use

### Create A Controller

The controller manages top-layer tracking for one `Document` or `ShadowRoot`.

```ts
const controller = new TopLayerController(init?);
```

Use `attributeName` to customize the DOM attribute written to active top-layer elements.

```ts
const controller = new TopLayerController({
    attributeName: "data-layer-order"
});
```

### Start And Stop Tracking

```ts
controller.connect(root?);
controller.disconnect();
```

- `connect(root?)` starts observing a `Document` or `ShadowRoot`
- if no root is provided, it defaults to `document`
- `disconnect()` stops DOM observation and clears existing subscriptions

### Read Current State

```ts
const elements = controller.getElements();
const topElement = controller.getTopElement();
```

- `getElements()` returns the active managed top-layer elements in ascending stack order
- `getTopElement()` returns the current top-most element, or `null`

### Subscribe To Changes

```ts
const unsubscribe = controller.subscribe((event) => {
    console.log(event);
});

unsubscribe();
```

- `subscribe(callback)` registers a listener for top-layer enter and exit events
- it returns a cleanup function that removes that listener

### What The Controller Writes To The DOM

When an element is active in the tracked top layer, the controller writes its position back to the DOM:

```html
<dialog data-top-layer-index="0"></dialog>
<div popover data-top-layer-index="1"></div>
```

This attribute is removed when an element leaves the tracked top layer.

## Supported Elements

Currently supported top-layer primitives include:

- modal `<dialog>` elements
- elements using the Popover API

Additional browser primitives may be supported over time as the platform evolves.

## API Reference

### `TopLayerController`

```ts
new TopLayerController(init?)
```

Creates a controller for tracking supported top-layer elements.

### `TopLayerControllerInit`

```ts
type TopLayerControllerInit = {
    attributeName?: string;
};
```

- `attributeName` customizes the data attribute written to active top-layer elements
- default: `"data-top-layer-index"`

### `connect(root?)`

```ts
connect(root?: Document | ShadowRoot): void
```

Starts tracking top-layer changes for a `Document` or `ShadowRoot`. Defaults to `document`.

### `disconnect()`

```ts
disconnect(): void
```

Stops DOM observation and clears existing subscriptions.

### `subscribe(callback)`

```ts
subscribe(callback: TopLayerChangeCallback): () => void
```

Registers a listener for top-layer enter and exit events and returns an unsubscribe function.

### `getElements()`

```ts
getElements(): Element[]
```

Returns the active managed top-layer elements in ascending stack order.

### `getTopElement()`

```ts
getTopElement(): Element | null
```

Returns the current top-most managed element, or `null` when no supported top-layer elements are active.

### `TopLayerChangeEvent`

Each subscription callback receives a single event describing the change and the current ordered stack:

```ts
type TopLayerEnterEvent = {
    type: "enter";
    target: Element;
    index: number;
    elements: Element[];
};

type TopLayerExitEvent = {
    type: "exit";
    target: Element;
    elements: Element[];
};

type TopLayerChangeEvent = TopLayerEnterEvent | TopLayerExitEvent;
```

## License

MIT
