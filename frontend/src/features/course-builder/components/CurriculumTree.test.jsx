import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import CurriculumTree from "./CurriculumTree";

const mockRouterPost = vi.hoisted(() => vi.fn());

vi.mock("@dnd-kit/core", () => ({
    DndContext: ({ children }) => <div>{children}</div>,
    closestCenter: vi.fn(),
    KeyboardSensor: vi.fn(),
    PointerSensor: vi.fn(),
    useSensor: vi.fn(),
    useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
    arrayMove: vi.fn((items) => items),
    SortableContext: ({ children }) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: undefined,
        isDragging: false,
    }),
    verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
    CSS: {
        Transform: {
            toString: () => "",
        },
    },
}));

vi.mock("@inertiajs/react", () => ({
    router: {
        post: mockRouterPost,
        reload: vi.fn(),
    },
}));

vi.mock("./SearchMaterialsModal", () => ({
    default: () => null,
}));

vi.mock("@mui/material", () => {
    const muiOnlyProps = [
        "alignItems",
        "autoFocus",
        "borderColor",
        "color",
        "component",
        "direction",
        "disablePadding",
        "display",
        "error",
        "fontWeight",
        "fullWidth",
        "helperText",
        "inputProps",
        "justifyContent",
        "maxWidth",
        "mt",
        "preserveScroll",
        "primaryTypographyProps",
        "size",
        "spacing",
        "startIcon",
        "sx",
        "textTransform",
        "variant",
    ];
    const cleanProps = (props) => {
        const cleaned = { ...props };
        muiOnlyProps.forEach((prop) => {
            delete cleaned[prop];
        });
        return cleaned;
    };
    const passthrough = (Tag = "div") => {
        function MockMuiComponent({ children, ...props }) {
            return <Tag {...cleanProps(props)}>{children}</Tag>;
        }
        MockMuiComponent.displayName = `MockMui${Tag}`;
        return MockMuiComponent;
    };

    return {
        Box: passthrough("div"),
        Typography: passthrough("span"),
        Button: passthrough("button"),
        IconButton: passthrough("button"),
        List: passthrough("ul"),
        ListItem: passthrough("li"),
        ListItemButton: passthrough("button"),
        ListItemText: ({ primary, secondary }) => (
            <span>
                {primary}
                {secondary}
            </span>
        ),
        Paper: passthrough("div"),
        Stack: passthrough("div"),
        Dialog: ({ children, open }) => (open ? <div>{children}</div> : null),
        DialogTitle: passthrough("div"),
        DialogContent: passthrough("div"),
        DialogContentText: passthrough("p"),
        DialogActions: passthrough("div"),
        TextField: passthrough("input"),
        Select: passthrough("select"),
        MenuItem: passthrough("option"),
        FormControl: passthrough("div"),
        InputLabel: passthrough("label"),
        Divider: passthrough("hr"),
    };
});

vi.mock("@mui/icons-material", () => {
    const Icon = () => <span />;
    return {
        Add: Icon,
        Edit: Icon,
        Delete: Icon,
        DragIndicator: Icon,
        ExpandMore: Icon,
        ExpandLess: Icon,
        Search: Icon,
        Article: Icon,
        OndemandVideo: Icon,
        VideoCameraFront: Icon,
        Cast: Icon,
        Quiz: Icon,
        AssignmentTurnedIn: Icon,
        PictureAsPdf: Icon,
        Close: Icon,
        Code: Icon,
        LocationOn: Icon,
    };
});

describe("CurriculumTree", () => {
    beforeEach(() => {
        mockRouterPost.mockReset();
    });

    const program = {
        id: 42,
        level: "Beginner",
        taxonomy: {
            builderHierarchy: ["Unit", "Session"],
        },
    };
    const blueprint = {
        featureFlags: {
            quizzes: true,
            assignments: true,
            practicum: false,
            portfolio: false,
            gamification: false,
        },
    };

    test("uses blueprint terminology in the empty curriculum prompt and container create UI", () => {
        render(
            <CurriculumTree
                program={program}
                nodes={[]}
                blueprint={blueprint}
            />,
        );

        expect(screen.queryByText("Program level: Beginner")).not.toBeInTheDocument();
        expect(screen.getByText("Start by adding your first Unit.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "New Unit" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "New section" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "New Unit" }));

        expect(screen.getAllByText("New Unit")).toHaveLength(2);
    });

    test("keeps lesson terminology stable when adding content inside a container", () => {
        render(
            <CurriculumTree
                program={program}
                nodes={[
                    {
                        id: 7,
                        title: "Safety Basics",
                        children: [],
                        properties: {},
                    },
                ]}
                blueprint={blueprint}
            />,
        );

        expect(screen.getByRole("button", { name: "Add a lesson" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Add a Session" })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Add a lesson" }));

        expect(screen.getByText("Select Lesson Type")).toBeInTheDocument();
        expect(screen.getByText("Text Lesson")).toBeInTheDocument();
        expect(screen.getByText("Live Meeting")).toBeInTheDocument();
        expect(screen.getByText("Live Stream")).toBeInTheDocument();
        expect(screen.getByText("In-person Session")).toBeInTheDocument();
        expect(screen.queryByText("Live Class")).not.toBeInTheDocument();

        fireEvent.click(screen.getByText("Text Lesson"));

        expect(mockRouterPost).toHaveBeenCalledWith(
            "/instructor/programs/42/nodes/create/",
            expect.objectContaining({
                title: "Untitled Lesson",
                type: "Lesson",
                properties: { lesson_type: "text" },
            }),
            expect.any(Object),
        );
    });
});
