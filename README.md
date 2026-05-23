# dom-top-layer

`dom-top-layer` is a framework-agnostic TypeScript library for tracking which elements are currently active in the browser's top layer and for reacting to changes over time.

## Why

Modern browsers expose several features that participate in the top layer, such as `dialog` and `popover` elements. What browsers do not currently provide is a first-class, framework-agnostic way to inspect the active top-layer stack or subscribe to changes in that stack.

`dom-top-layer` is intended to fill that gap with a small, focused browser utility that can later power framework adapters, hooks, or application-specific integrations without making those choices part of the core package.

## How It Works

`dom-top-layer` keeps a lightweight, synchronized view of the browser top layer by watching the DOM for signals that relevant elements have entered or left it.

At a high level, the controller:

- connects to a `Document` or `ShadowRoot`
- listens for mutations and top-layer lifecycle events
- finds supported active top-layer elements
- writes their order back into the DOM as `data-top-layer-index`
- emits enter and exit events when that ordered stack changes

This makes the DOM attribute the shared source of truth for consumers that want to inspect state directly, while `subscribe()` provides a convenient subscription layer for reacting to changes over time.

The current implementation is centered on browser primitives like dialogs and popovers. The browser does not expose the native top-layer stack order directly. `dom-top-layer` maintains a synchronized inferred order based on observed lifecycle activity.

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

## API

### `TopLayerController`

The controller manages top-layer tracking for one `Document` or `ShadowRoot`.

### Create A Controller

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

Each callback receives a single event describing the change and the current ordered stack:

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
```

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

## License

MIT
