import type {
    TopLayerChangeCallback,
    TopLayerChangeEvent,
    TopLayerControllerInit,
    TopLayerEnterEvent,
    TopLayerExitEvent
} from "./types";

/**
 * The default data attribute used to store top-layer indices in the DOM.
 *
 * @private
 */
const DEFAULT_ATTRIBUTE_NAME = "data-top-layer-index";

/**
 * Connects DOM listeners, synchronizes top-layer state into data attributes,
 * and exposes synchronous top-layer queries.
 *
 * @public
 * @since 0.2.0
 */
export class TopLayerController {
    private readonly attributeName: string;
    private readonly observers = new Set<TopLayerChangeCallback>();
    private managedElements: Element[] = [];
    private root: Document | ShadowRoot | null = null;
    private mutationObserver: MutationObserver | null = null;

    /**
     * Creates a controller that manages top-layer indices in the DOM.
     *
     * @param init Optional controller configuration.
     */
    public constructor(init: TopLayerControllerInit = {}) {
        this.attributeName = init.attributeName ?? DEFAULT_ATTRIBUTE_NAME;
    }

    /**
     * Connects the controller to a root, starts listening for top-layer
     * changes, and performs an initial synchronization pass.
     *
     * @param root The root to observe. Defaults to the global document.
     */
    public connect(root: Document | ShadowRoot = document): void {
        if (this.root === root && this.mutationObserver !== null) {
            return;
        }

        this.disconnectRoot();

        this.root = root;
        this.mutationObserver = new MutationObserver(() => {
            this.sync();
        });

        this.mutationObserver.observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["open", "popover"]
        });

        root.addEventListener("toggle", this.handlePotentialChange, true);
        root.addEventListener("close", this.handlePotentialChange, true);

        this.sync();
    }

    /**
     * Disconnects DOM listeners and stops future synchronization.
     */
    public disconnect(): void {
        this.disconnectRoot();
        this.observers.clear();
    }

    /**
     * Disconnects DOM listeners from the current root without clearing
     * callback subscriptions.
     *
     * @private
     */
    private disconnectRoot(): void {
        this.mutationObserver?.disconnect();
        this.mutationObserver = null;

        this.root?.removeEventListener(
            "toggle",
            this.handlePotentialChange,
            true
        );
        this.root?.removeEventListener(
            "close",
            this.handlePotentialChange,
            true
        );

        this.root = null;
        this.managedElements = [];
    }

    /**
     * Returns the currently managed top-layer elements in ascending index order.
     *
     * @returns The ordered active top-layer elements.
     */
    public getElements(): Element[] {
        if (this.root === null) return [];
        return [...this.managedElements];
    }

    /**
     * Returns the highest indexed managed top-layer element.
     *
     * @returns The current top-most element, or `null` when no elements are
     * managed.
     */
    public getTopElement(): Element | null {
        const elements = this.getElements();
        const topElement = elements[elements.length - 1];
        return topElement ?? null;
    }

    /**
     * Registers a callback for top-layer change notifications.
     *
     * @param callback Invoked whenever the controller emits a top-layer change.
     * @returns A function that removes the callback subscription.
     */
    public subscribe(callback: TopLayerChangeCallback): () => void {
        this.observers.add(callback);

        return () => {
            this.observers.delete(callback);
        };
    }

    /**
     * Handles DOM signals that may indicate a top-layer state change.
     *
     * @private
     */
    private readonly handlePotentialChange = (event: Event): void => {
        const target = event.target;

        if (
            event.type === "toggle" &&
            target instanceof Element &&
            target.hasAttribute("popover")
        ) {
            this.syncPopoverTarget(target, event);
            return;
        }

        this.sync();
    };

    /**
     * Reconciles active top-layer elements with the managed DOM attributes and
     * emits callback notifications for any enters or exits.
     *
     * @private
     */
    private sync(): void {
        if (this.root === null) return;

        const previousElements = [...this.managedElements];
        const activeElements = this.getActiveTopLayerElements(this.root);
        const nextElements = this.buildNextElements(
            activeElements,
            previousElements
        );

        this.writeManagedAttributes(previousElements, nextElements);
        this.managedElements = [...nextElements];
        this.emitChanges(previousElements, nextElements);
    }

    /**
     * Synchronizes a popover from its lifecycle event instead of relying solely
     * on selector-based current-state detection.
     *
     * @param target The popover element that toggled.
     * @param event The lifecycle event describing the popover state change.
     * @private
     */
    private syncPopoverTarget(target: Element, event: Event): void {
        if (this.root === null) return;

        const previousElements = [...this.managedElements];
        const activeDialogs = this.getActiveDialogElements(this.root);
        const activePopovers = this.getManagedPopoverElements().filter(
            (element) => element !== target
        );

        if (this.isPopoverOpenFromEvent(target, event)) {
            activePopovers.push(target);
        }

        const activeElements = [...activeDialogs, ...activePopovers];
        const nextElements = this.buildNextElements(
            activeElements,
            previousElements
        );

        this.writeManagedAttributes(previousElements, nextElements);
        this.managedElements = [...nextElements];
        this.emitChanges(previousElements, nextElements);
    }

    /**
     * Builds the next managed top-layer ordering by retaining existing managed
     * order where possible and appending newly active elements afterward.
     *
     * @param activeElements Elements currently considered active in the top layer.
     * @param previousElements Elements that were previously managed in the DOM.
     * @returns The next ordered list of managed top-layer elements.
     * @private
     */
    private buildNextElements(
        activeElements: Element[],
        previousElements: Element[]
    ): Element[] {
        const activeSet = new Set(activeElements);
        const nextElements: Element[] = [];
        const seen = new Set<Element>();
        const orderedPrevious =
            this.sortElementsByManagedIndex(previousElements);

        for (const element of orderedPrevious) {
            if (!activeSet.has(element) || seen.has(element)) {
                continue;
            }

            nextElements.push(element);
            seen.add(element);
        }

        for (const element of activeElements) {
            if (seen.has(element)) {
                continue;
            }

            nextElements.push(element);
            seen.add(element);
        }

        return nextElements;
    }

    /**
     * Emits enter and exit events for differences between the previous and next
     * managed element lists.
     *
     * @param previousElements The previously managed elements.
     * @param nextElements The newly managed elements.
     * @private
     */
    private emitChanges(
        previousElements: Element[],
        nextElements: Element[]
    ): void {
        if (this.observers.size === 0) {
            return;
        }

        const previousSet = new Set(previousElements);
        const nextSet = new Set(nextElements);

        for (const element of nextElements) {
            if (previousSet.has(element)) {
                continue;
            }

            const event: TopLayerEnterEvent = {
                type: "enter",
                target: element,
                index: nextElements.indexOf(element),
                elements: [...nextElements]
            };

            this.notifyObservers(event);
        }

        for (const element of previousElements) {
            if (nextSet.has(element)) {
                continue;
            }

            const event: TopLayerExitEvent = {
                type: "exit",
                target: element,
                elements: [...nextElements]
            };

            this.notifyObservers(event);
        }
    }

    /**
     * Notifies each callback of a top-layer change while isolating callback
     * errors so one listener cannot prevent others from running.
     *
     * @param event The change event to deliver.
     * @private
     */
    private notifyObservers(event: TopLayerChangeEvent): void {
        for (const observer of this.observers) {
            try {
                observer(event);
            } catch (error) {
                queueMicrotask(() => {
                    throw error;
                });
            }
        }
    }

    /**
     * Returns elements that currently participate in the browser top layer for
     * the supported features in this runtime.
     *
     * @param root The root to scan for active top-layer elements.
     * @returns The active top-layer elements discovered in the root.
     * @private
     */
    private getActiveTopLayerElements(root: Document | ShadowRoot): Element[] {
        return [
            ...this.getActiveDialogElements(root),
            ...this.getActivePopoverElements(root)
        ];
    }

    /**
     * Returns dialogs that are currently open within the observed root.
     *
     * @param root The root to scan for open dialogs.
     * @returns The currently open dialog elements.
     * @private
     */
    private getActiveDialogElements(root: Document | ShadowRoot): Element[] {
        return Array.from(root.querySelectorAll("dialog[open]"));
    }

    /**
     * Returns popovers that can be detected as currently open from a DOM scan.
     *
     * _Note: Popovers are primarily synchronized from lifecycle events, while
     * this scan falls back to `:popover-open` when current-state
     * detection is still needed._
     *
     * @param root The root to scan for open popovers.
     * @returns The currently open popover elements that the runtime can detect.
     * @private
     */
    private getActivePopoverElements(root: Document | ShadowRoot): Element[] {
        const activeElements: Element[] = [];

        for (const element of root.querySelectorAll("[popover]")) {
            if (!this.matchesPopoverOpenSelector(element)) {
                continue;
            }

            activeElements.push(element);
        }

        return activeElements;
    }

    /**
     * Returns popovers that are currently managed by the controller.
     *
     * @returns Managed elements that are popovers.
     * @private
     */
    private getManagedPopoverElements(): Element[] {
        return this.managedElements.filter((element) => {
            return element.hasAttribute("popover");
        });
    }

    /**
     * Determines whether a lifecycle event indicates that a popover is open.
     *
     * When the event exposes `newState`, that value is preferred. Otherwise the
     * controller falls back to selector matching.
     *
     * @param target The popover element being synchronized.
     * @param event The lifecycle event that fired for the popover.
     * @returns `true` when the popover should be treated as open.
     * @private
     */
    private isPopoverOpenFromEvent(target: Element, event: Event): boolean {
        const toggleEvent = event as Event & { newState?: string };

        if (toggleEvent.newState === "open") {
            return true;
        }

        if (toggleEvent.newState === "closed") {
            return false;
        }

        return this.matchesPopoverOpenSelector(target);
    }

    /**
     * Tests whether an element matches `:popover-open`.
     *
     * @param element The element to test.
     * @returns `true` when the element matches `:popover-open`.
     * @private
     */
    private matchesPopoverOpenSelector(element: Element): boolean {
        let isOpen: boolean;

        // Guard against runtimes that do not support the :popover-open selector.
        try {
            isOpen = element.matches(":popover-open");
        } catch {
            isOpen = false;
        }

        return isOpen;
    }

    /**
     * Sorts elements by their managed top-layer index.
     *
     * @param elements The elements to sort.
     * @returns A new array ordered by managed index.
     * @private
     */
    private sortElementsByManagedIndex(elements: Element[]): Element[] {
        const uniqueElements = Array.from(new Set(elements));

        return uniqueElements.sort((left, right) => {
            const leftIndex = this.getManagedIndex(left);
            const rightIndex = this.getManagedIndex(right);
            return leftIndex - rightIndex;
        });
    }

    /**
     * Reads the managed top-layer index from an element.
     *
     * Invalid or missing values sort to the end so partially managed DOM state
     * does not break ordering.
     *
     * @param element The element whose managed index should be read.
     * @returns The parsed managed index, or a large fallback value when missing.
     * @private
     */
    private getManagedIndex(element: Element): number {
        const value = element.getAttribute(this.attributeName);
        const index = value === null ? Number.NaN : Number.parseInt(value, 10);

        return Number.isNaN(index) ? Number.MAX_SAFE_INTEGER : index;
    }

    /**
     * Writes managed top-layer indices to the next active elements and removes
     * the managed attribute from elements that are no longer active.
     *
     * @param root The root containing managed elements.
     * @param nextElements The elements that should remain managed.
     * @private
     */
    private writeManagedAttributes(
        previousElements: Element[],
        nextElements: Element[]
    ): void {
        const nextSet = new Set(nextElements);

        for (const element of previousElements) {
            if (nextSet.has(element)) {
                continue;
            }

            element.removeAttribute(this.attributeName);
        }

        for (const [index, element] of nextElements.entries()) {
            const value = String(index);

            if (element.getAttribute(this.attributeName) === value) {
                continue;
            }

            element.setAttribute(this.attributeName, value);
        }
    }
}
