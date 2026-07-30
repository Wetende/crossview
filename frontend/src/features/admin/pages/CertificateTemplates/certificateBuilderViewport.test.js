import { describe, expect, it } from "vitest";

import {
    BUILDER_ZOOM,
    fitBuilderZoom,
    stepBuilderZoom,
} from "./certificateBuilderViewport";

describe("certificate builder viewport", () => {
    it("supports detailed zooming up to 300 percent", () => {
        expect(BUILDER_ZOOM.max).toBe(3);
        expect(stepBuilderZoom(1.2, 1)).toBe(1.3);
        expect(stepBuilderZoom(2.95, 1)).toBe(3);
        expect(stepBuilderZoom(3, 1)).toBe(3);
    });

    it("keeps zoom-out bounded and calculates a true fit", () => {
        expect(stepBuilderZoom(0.35, -1)).toBe(0.35);
        expect(
            fitBuilderZoom({
                viewportWidth: 1000,
                viewportHeight: 700,
                canvasWidth: 960,
                canvasHeight: 680,
                padding: 64,
            }),
        ).toBeCloseTo(0.935, 3);
    });
});
