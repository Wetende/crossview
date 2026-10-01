import { describe, expect, test } from "vitest";

import fixtures from "../../../apps/core/tests/fixtures/intro_video_urls.json";
import {
    INTRO_VIDEO_URL_ERROR,
    getIntroVideoUrlError,
    isSupportedIntroVideoUrl,
} from "./introVideoUrl";

// The same fixture drives apps/core/tests/test_course_landing_pack.py, so the
// builder and the server accept exactly the same links.
describe("intro video URL validation", () => {
    test.each(fixtures.accepted)("accepts %s", (url) => {
        expect(isSupportedIntroVideoUrl(url)).toBe(true);
        expect(isSupportedIntroVideoUrl(`  ${url}  `)).toBe(true);
        expect(getIntroVideoUrlError(url)).toBe("");
    });

    test.each(fixtures.rejected)("rejects %s", (url) => {
        expect(isSupportedIntroVideoUrl(url)).toBe(false);
        expect(getIntroVideoUrlError(url)).toBe(INTRO_VIDEO_URL_ERROR);
    });

    test("treats a blank value as no intro video", () => {
        expect(getIntroVideoUrlError("")).toBe("");
        expect(getIntroVideoUrlError("   ")).toBe("");
        expect(getIntroVideoUrlError(null)).toBe("");
        expect(isSupportedIntroVideoUrl("")).toBe(false);
    });
});
