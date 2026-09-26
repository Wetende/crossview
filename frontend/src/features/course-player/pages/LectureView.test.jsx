import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LectureView from "./LectureView";

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    router: { visit: vi.fn(), post: vi.fn() },
    usePage: () => ({ props: {} }),
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

// react-pdf needs browser APIs jsdom does not provide.
vi.mock("../components/Renderers/PDFRenderer", () => ({ default: () => null }));

const node = {
    id: 11,
    title: "Welcome",
    type: "Lesson",
    activityType: "text",
    properties: { lesson_type: "text", content: "<p>Welcome aboard</p>" },
    blocks: [],
    supplements: [],
    completionPolicy: { kind: "manual" },
    activityProgress: null,
};

const curriculum = [
    {
        id: 1,
        title: "Getting started",
        nodeType: "Module",
        isLocked: true,
        lockReasonText: "Enrol to unlock",
        children: [
            {
                id: 11,
                title: "Welcome",
                activityType: "text",
                isLocked: false,
                url: "/programs/preview-course/preview/11/",
                children: [],
            },
            {
                id: 12,
                title: "Deep dive",
                activityType: "video",
                isLocked: true,
                lockReason: "enrollment_required",
                lockReasonText: "Enrol to unlock",
                url: null,
                children: [],
            },
        ],
    },
];

const renderPreview = (props = {}) =>
    render(
        <LectureView
            program={{ id: 3, name: "Preview Course" }}
            enrollment={null}
            node={node}
            curriculum={curriculum}
            prevNode={null}
            nextNode={null}
            isCompleted={false}
            instructor={{ id: 5, name: "Ada" }}
            activeView="preview"
            preview={{
                programUrl: "/programs/preview-course/",
                enrolCta: {
                    label: "Enroll now",
                    href: "/programs/preview-course/",
                },
            }}
            {...props}
        />,
    );

describe("LectureView preview mode", () => {
    beforeEach(() => {
        // Desktop layout: the curriculum sits inline instead of in a modal drawer.
        window.matchMedia.mockImplementation((query) => ({
            matches: query.includes("min-width"),
            media: query,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
    });

    it("shows a persistent preview banner with the enrol CTA", () => {
        renderPreview();

        const banner = screen.getByRole("status");
        expect(banner).toHaveTextContent("You're previewing a free lesson");
        expect(
            screen.getAllByRole("link", { name: "Enroll now" })[0],
        ).toHaveAttribute("href", "/programs/preview-course/");
        expect(screen.getByText("Welcome aboard")).toBeInTheDocument();
    });

    it("hides enrolled-only tools and learner completion", () => {
        renderPreview({
            enrollment: { id: 9, gamification: { enabled: true, xp: 30 } },
        });

        expect(
            screen.queryByRole("button", { name: /Discussions/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: "Message instructor" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("30 XP")).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /complete/i }),
        ).not.toBeInTheDocument();
    });

    it("sends the header back link to the program page", () => {
        renderPreview();

        expect(
            screen.getByRole("link", { name: "Back to course page" }),
        ).toHaveAttribute("href", "/programs/preview-course/");
    });

    it("keeps the enrolled player unchanged outside preview mode", () => {
        renderPreview({
            activeView: null,
            preview: undefined,
            enrollment: { id: 9, progressPercent: 0 },
        });

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Discussions/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Mark complete" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Message instructor" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Back to dashboard" }),
        ).toHaveAttribute("href", "/dashboard/");
    });
});
