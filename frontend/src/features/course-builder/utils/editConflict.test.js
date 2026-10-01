import { describe, expect, test } from "vitest";

import { getFlashSeverity } from "@/utils/userMessages";
import { findNodeVersion, hasEditConflict } from "./editConflict";

describe("edit conflicts", () => {
    test("detects the conflict tag Django adds to the flash message", () => {
        const page = {
            props: { flash: [{ type: "edit-conflict error", message: "Changed through an AI app" }] },
        };
        expect(hasEditConflict(page)).toBe(true);
        expect(getFlashSeverity("edit-conflict error")).toBe("error");
    });

    test("ignores ordinary flash messages", () => {
        expect(hasEditConflict({ props: { flash: [{ type: "error", message: "Nope" }] } })).toBe(false);
        expect(hasEditConflict({ props: {} })).toBe(false);
        expect(getFlashSeverity("success")).toBe("success");
        expect(getFlashSeverity("")).toBe("info");
    });

    test("finds a node's version anywhere in the curriculum tree", () => {
        const curriculum = [
            { id: 1, version: "v1", children: [{ id: 2, version: "v2", children: [] }] },
        ];
        expect(findNodeVersion(curriculum, "2")).toBe("v2");
        expect(findNodeVersion(curriculum, 9)).toBeUndefined();
    });
});
