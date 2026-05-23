/**
 * Emitted when an element becomes active in the managed top-layer stack.
 *
 * @public
 * @since 0.2.0
 */
export type TopLayerEnterEvent = {
    /** The change kind for the event. */
    type: "enter";
    /** The element that entered the top layer. */
    target: Element;
    /** The managed top-layer index assigned to the target. */
    index: number;
    /** The current ordered top-layer elements after the change is applied. */
    elements: Element[];
};

/**
 * Emitted when an element leaves the managed top-layer stack.
 *
 * @public
 * @since 0.2.0
 */
export type TopLayerExitEvent = {
    /** The change kind for the event. */
    type: "exit";
    /** The element that left the top layer. */
    target: Element;
    /** The current ordered top-layer elements after the change is applied. */
    elements: Element[];
};

/**
 * A top-layer change event emitted by {@link TopLayerController}.
 *
 * @public
 * @since 0.2.0
 */
export type TopLayerChangeEvent = TopLayerEnterEvent | TopLayerExitEvent;

/**
 * Receives enter and exit notifications from a {@link TopLayerController}.
 *
 * @param event The emitted top-layer change event.
 * @public
 * @since 0.2.0
 */
export type TopLayerChangeCallback = (event: TopLayerChangeEvent) => void;

/**
 * Configuration for a {@link TopLayerController}.
 *
 * @public
 * @since 0.2.0
 */
export type TopLayerControllerInit = {
    /**
     * The data attribute used to store managed top-layer indices.
     *
     * @defaultValue `"data-top-layer-index"`
     */
    attributeName?: string;
};
