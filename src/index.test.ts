import { describe, expect, it } from "vitest";
import * as domTopLayer from "./index";

describe("dom-top-layer package", () => {
    it("exposes a valid module entrypoint", () => {
        expect(Object.keys(domTopLayer)).toEqual([]);
    });
});
