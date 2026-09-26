import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import InstructorProgramBuilder from "./Builder";

const mockPage = vi.hoisted(() => ({ current: { url: "/", props: {} } }));
const mockTreeProps = vi.hoisted(() => ({ current: null }));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    router: { post: vi.fn() },
    usePage: () => mockPage.current,
}));

vi.mock("@/theme/index", () => ({
    useThemeMode: () => ({ mode: "light", toggleMode: vi.fn() }),
}));

vi.mock("@/layouts/CourseBuilderLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../components/CurriculumTree", async () => {
    const actual = await vi.importActual("../components/CurriculumTree");
    return {
        flattenNodes: actual.flattenNodes,
        default: (props) => {
            mockTreeProps.current = props;
            return null;
        },
    };
});

const mockPausedChanges = vi.hoisted(() => ({ current: null }));

vi.mock("../editors/EditorContainer", async () => {
    const { forwardRef, useImperativeHandle } = await vi.importActual("react");
    return {
        default: forwardRef(function MockEditor({ node }, ref) {
            useImperativeHandle(ref, () => ({
                flushAutosave: async () =>
                    mockPausedChanges.current
                        ? { skipped: true, paused: true, ...mockPausedChanges.current }
                        : { skipped: true },
                hasPausedUnsavedChanges: () => Boolean(mockPausedChanges.current),
            }));
            return <div data-testid="editor">{node.title}</div>;
        }),
    };
});

vi.mock("../components/SettingsPanel", () => ({ default: () => null }));
vi.mock("../components/CoursePublicationControls", () => ({
    default: () => null,
}));

const program = { id: 5, name: "Circuits", blueprint: null, resources: [] };
const buildCurriculum = () => [
    {
        id: 1,
        title: "Unit 1",
        type: "Unit",
        children: [
            { id: 12, title: "Lesson 12", type: "Session", children: [] },
            { id: 13, title: "Lesson 13", type: "Session", children: [] },
        ],
    },
];

const visit = (url, curriculum = buildCurriculum()) => {
    window.history.replaceState({}, "", url);
    mockPage.current = { url, props: { curriculum } };
};

describe("Builder ?node= selection", () => {
    beforeEach(() => {
        mockTreeProps.current = null;
        mockPausedChanges.current = null;
    });

    afterEach(() => {
        window.history.replaceState({}, "", "/");
        vi.restoreAllMocks();
    });

    test("opens the lesson named by ?node= after a server redirect", () => {
        visit("/instructor/programs/5/manage/?node=12");
        render(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );

        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 12");
    });

    test("keeps the instructor's own selection when the same URL refreshes", async () => {
        visit("/instructor/programs/5/manage/?node=12");
        const { rerender } = render(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );

        await act(async () => {
            await mockTreeProps.current.onNodeSelect({ id: 13 });
        });
        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 13");

        // e.g. a Q&A action redirects back to the referer with fresh props.
        visit("/instructor/programs/5/manage/?node=12");
        rerender(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );
        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 13");

        // A new redirect naming a lesson applies again.
        visit("/instructor/programs/5/manage/");
        rerender(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );
        visit("/instructor/programs/5/manage/?node=12");
        rerender(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );
        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 12");
    });

    test("asks before leaving a lesson whose edits autosave could not save", async () => {
        visit("/instructor/programs/5/manage/?node=12");
        render(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );
        mockPausedChanges.current = {
            pauseReason: "select a timezone",
            lessonTitle: "Lesson 12",
        };
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

        let allowed;
        await act(async () => {
            allowed = await mockTreeProps.current.onNodeSelect({ id: 13 });
        });

        expect(confirm).toHaveBeenCalledWith(
            'Unsaved changes in "Lesson 12": select a timezone.\n\nLeave this lesson and discard them?',
        );
        expect(allowed).toBe(false);
        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 12");

        confirm.mockReturnValue(true);
        await act(async () => {
            allowed = await mockTreeProps.current.onNodeSelect({ id: 13 });
        });
        expect(allowed).toBe(true);
        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 13");
    });

    test("does not jump to a ?node= lesson over paused unsaved edits", () => {
        visit("/instructor/programs/5/manage/?node=12");
        const { rerender } = render(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );
        mockPausedChanges.current = {
            pauseReason: "select a timezone",
            lessonTitle: "Lesson 12",
        };

        visit("/instructor/programs/5/manage/?node=13");
        rerender(
            <InstructorProgramBuilder
                program={program}
                curriculum={mockPage.current.props.curriculum}
            />,
        );

        expect(screen.getByTestId("editor")).toHaveTextContent("Lesson 12");
    });
});
