import { afterEach, describe, expect, it } from "vitest";
import { TopLayerController } from "./TopLayerController";
import type { TopLayerChangeEvent } from "./types";

describe("TopLayerController", () => {
    const controllers: TopLayerController[] = [];

    afterEach(() => {
        for (const controller of controllers.splice(0)) {
            controller.disconnect();
        }

        document.body.innerHTML = "";
    });

    it("syncs open dialogs into managed DOM attributes on connect", () => {
        const first = document.createElement("dialog");
        const second = document.createElement("dialog");

        first.setAttribute("open", "");
        second.setAttribute("open", "");

        document.body.append(first, second);

        const controller = new TopLayerController();
        controllers.push(controller);
        controller.connect(document);

        expect(first.getAttribute("data-top-layer-index")).toBe("0");
        expect(second.getAttribute("data-top-layer-index")).toBe("1");
        expect(controller.getElements()).toEqual([first, second]);
        expect(controller.getTopElement()).toBe(second);
    });

    it("preserves existing DOM order and appends newly opened dialogs", async () => {
        const first = document.createElement("dialog");
        const second = document.createElement("dialog");

        first.setAttribute("open", "");

        document.body.append(first, second);

        const controller = new TopLayerController();
        controllers.push(controller);
        controller.connect(document);

        second.setAttribute("open", "");
        await flushDomUpdates();

        expect(first.getAttribute("data-top-layer-index")).toBe("0");
        expect(second.getAttribute("data-top-layer-index")).toBe("1");
        expect(controller.getElements()).toEqual([first, second]);
    });

    it("removes managed attributes when a dialog closes", async () => {
        const dialog = document.createElement("dialog");
        dialog.setAttribute("open", "");
        document.body.append(dialog);

        const controller = new TopLayerController();

        controllers.push(controller);
        controller.connect(document);

        dialog.removeAttribute("open");
        await flushDomUpdates();

        expect(dialog.hasAttribute("data-top-layer-index")).toBe(false);
    });

    it("supports a custom managed attribute name", () => {
        const dialog = document.createElement("dialog");
        dialog.setAttribute("open", "");
        document.body.append(dialog);

        const controller = new TopLayerController({
            attributeName: "data-layer-order"
        });

        controllers.push(controller);
        controller.connect(document);

        expect(dialog.getAttribute("data-layer-order")).toBe("0");
        expect(dialog.hasAttribute("data-top-layer-index")).toBe(false);
    });

    it("emits an enter event with the current ordered elements", async () => {
        const first = document.createElement("dialog");
        const second = document.createElement("dialog");

        first.setAttribute("open", "");
        document.body.append(first, second);

        const events: TopLayerChangeEvent[] = [];
        const controller = new TopLayerController();

        controllers.push(controller);
        controller.subscribe((event) => {
            events.push(event);
        });
        controller.connect(document);

        events.length = 0;
        second.setAttribute("open", "");
        await flushDomUpdates();

        expect(events).toEqual([
            {
                type: "enter",
                target: second,
                index: 1,
                elements: [first, second]
            }
        ]);
    });

    it("emits an exit event when a dialog closes", async () => {
        const dialog = document.createElement("dialog");
        dialog.setAttribute("open", "");
        document.body.append(dialog);

        const events: TopLayerChangeEvent[] = [];
        const controller = new TopLayerController();

        controllers.push(controller);
        controller.subscribe((event) => {
            events.push(event);
        });
        controller.connect(document);

        events.length = 0;
        dialog.removeAttribute("open");
        await flushDomUpdates();

        expect(events).toEqual([
            {
                type: "exit",
                target: dialog,
                elements: []
            }
        ]);
    });

    it("updates state when a managed dialog is removed from the document", async () => {
        const dialog = document.createElement("dialog");
        dialog.setAttribute("open", "");
        document.body.append(dialog);

        const events: TopLayerChangeEvent[] = [];
        const controller = new TopLayerController();

        controllers.push(controller);
        controller.subscribe((event) => {
            events.push(event);
        });
        controller.connect(document);

        events.length = 0;
        dialog.remove();
        await flushDomUpdates();

        expect(controller.getElements()).toEqual([]);
        expect(controller.getTopElement()).toBeNull();
        expect(dialog.hasAttribute("data-top-layer-index")).toBe(false);
        expect(events).toEqual([
            {
                type: "exit",
                target: dialog,
                elements: []
            }
        ]);
    });

    it("stops notifying an unsubscribed callback", async () => {
        const dialog = document.createElement("dialog");
        document.body.append(dialog);

        const events: TopLayerChangeEvent[] = [];
        const controller = new TopLayerController();

        controllers.push(controller);
        const unsubscribe = controller.subscribe((event) => {
            events.push(event);
        });
        controller.connect(document);
        unsubscribe();

        dialog.setAttribute("open", "");
        await flushDomUpdates();

        expect(events).toEqual([]);
    });

    it("does not retain callbacks after the controller disconnects", async () => {
        const dialog = document.createElement("dialog");
        document.body.append(dialog);

        const events: TopLayerChangeEvent[] = [];
        const controller = new TopLayerController();

        controllers.push(controller);
        controller.subscribe((event) => {
            events.push(event);
        });
        controller.connect(document);
        controller.disconnect();
        controller.connect(document);

        dialog.setAttribute("open", "");
        await flushDomUpdates();

        expect(events).toEqual([]);
    });

    it("tracks popovers from toggle lifecycle events", () => {
        const popover = document.createElement("div");
        popover.setAttribute("popover", "manual");
        popover.matches = () => {
            throw new DOMException("Unsupported selector", "SyntaxError");
        };

        document.body.append(popover);

        const controller = new TopLayerController();
        controllers.push(controller);
        controller.connect(document);

        popover.dispatchEvent(createToggleEvent("open"));
        expect(popover.getAttribute("data-top-layer-index")).toBe("0");

        popover.dispatchEvent(createToggleEvent("closed"));
        expect(popover.hasAttribute("data-top-layer-index")).toBe(false);
    });

    it("stops syncing after the controller disconnects", async () => {
        const dialog = document.createElement("dialog");
        document.body.append(dialog);

        const controller = new TopLayerController();
        controllers.push(controller);
        controller.connect(document);
        controller.disconnect();

        dialog.setAttribute("open", "");
        await flushDomUpdates();

        expect(dialog.hasAttribute("data-top-layer-index")).toBe(false);
        expect(controller.getElements()).toEqual([]);
        expect(controller.getTopElement()).toBeNull();
    });
});

async function flushDomUpdates(): Promise<void> {
    await Promise.resolve();
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

function createToggleEvent(newState: "open" | "closed"): Event {
    const event = new Event("toggle", { bubbles: true });
    Object.defineProperty(event, "newState", {
        configurable: true,
        value: newState
    });

    return event;
}
