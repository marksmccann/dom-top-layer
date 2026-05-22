import { describe, expect, it } from "vitest";
import * as toplayer from "./index";

describe("toplayer package", () => {
    it("exposes a valid module entrypoint", () => {
        expect(Object.keys(toplayer)).toEqual([]);
    });
});
