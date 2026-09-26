import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import SettingsPanel from "./SettingsPanel";

const { routerPost } = vi.hoisted(() => ({ routerPost: vi.fn() }));

vi.mock("@inertiajs/react", async () => {
    const React = await import("react");
    return {
        router: { post: routerPost, visit: vi.fn() },
        usePage: () => ({ props: { auth: { user: {} }, platform: {} } }),
        useForm: (initial) => {
            const [data, setState] = React.useState(initial);
            const setData = React.useCallback((keyOrUpdater, value) => {
                if (typeof keyOrUpdater === "function") {
                    setState(keyOrUpdater);
                } else if (typeof keyOrUpdater === "string") {
                    setState((current) => ({ ...current, [keyOrUpdater]: value }));
                } else {
                    setState(keyOrUpdater);
                }
            }, []);
            return {
                data,
                setData,
                transform: vi.fn(),
                post: vi.fn(),
                processing: false,
                errors: {},
            };
        },
    };
});

vi.mock("./SidebarLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/components/RichTextEditor", () => ({ default: () => null }));
vi.mock("./SettingsEditors", () => ({
    PricingEditor: () => null,
    FAQEditor: () => null,
    NoticeEditor: () => null,
}));
vi.mock("./DripEditor", () => ({ default: () => null }));
vi.mock("./EngagementEditor", () => ({ default: () => null }));
vi.mock("@/features/certifications/components/CertificateTemplateSelector", () => ({
    default: () => null,
}));

const program = {
    id: 5,
    name: "Course",
    introVideoUrl: "",
    accessDurationDays: null,
};

const AUTOSAVE_DELAY_MS = 2000;
// Typing re-renders the whole panel once per character, which is slow when
// the suite runs in parallel.
const TYPING_TEST_TIMEOUT_MS = 30000;

const savedPayloads = () => routerPost.mock.calls.map(([, payload]) => payload);

function typeCharacterByCharacter(input, text) {
    for (let index = 1; index <= text.length; index += 1) {
        fireEvent.change(input, { target: { value: text.slice(0, index) } });
        act(() => {
            vi.advanceTimersByTime(100);
        });
    }
}

describe("SettingsPanel autosave", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        routerPost.mockReset();
        routerPost.mockImplementation((url, payload, options) => {
            options?.onSuccess?.();
            options?.onFinish?.();
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("saves the intro video URL once typing makes it valid", () => {
        const url = "https://youtu.be/dQw4w9WgXcQ";
        render(
            <SettingsPanel program={program} activeTab="settings" settingsSection="main" />,
        );

        typeCharacterByCharacter(
            screen.getByRole("textbox", { name: "Intro video URL" }),
            url,
        );
        act(() => {
            vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
        });

        const payloads = savedPayloads();
        expect(payloads.length).toBeGreaterThan(0);
        expect(payloads.at(-1)).toMatchObject({
            tab: "settings",
            section: "main",
            intro_video_url: url,
        });
        // Partial links are never sent; the saved value stays until the new
        // one is valid.
        for (const payload of payloads.slice(0, -1)) {
            expect(payload).not.toHaveProperty("intro_video_url");
        }
    }, TYPING_TEST_TIMEOUT_MS);

    test("keeps saving the rest of Main while the intro video URL is invalid", () => {
        render(
            <SettingsPanel program={program} activeTab="settings" settingsSection="main" />,
        );

        fireEvent.change(screen.getByRole("textbox", { name: "Intro video URL" }), {
            target: { value: "https://example.org/about" },
        });
        fireEvent.change(screen.getByPlaceholderText(/e\.g\. Beginner/), {
            target: { value: "Advanced" },
        });
        act(() => {
            vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
        });

        const payload = savedPayloads().at(-1);
        expect(payload).toMatchObject({ section: "main", level: "Advanced" });
        expect(payload).not.toHaveProperty("intro_video_url");
        expect(
            screen.getByText("Use a YouTube or Vimeo video link, or a direct HTTPS .mp4 or .webm file."),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    });

    test("saves an access limit once the days are entered", () => {
        render(
            <SettingsPanel
                program={program}
                activeTab="settings"
                settingsSection="access"
            />,
        );

        fireEvent.click(screen.getByRole("switch", { name: "Time limit" }));
        act(() => {
            vi.advanceTimersByTime(100);
        });
        fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "30" } });
        act(() => {
            vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
        });

        const payloads = savedPayloads();
        expect(payloads.at(-1)).toMatchObject({
            section: "access",
            access_duration_days: 30,
        });
        for (const payload of payloads.slice(0, -1)) {
            expect(payload).not.toHaveProperty("access_duration_days");
        }
    });
});
