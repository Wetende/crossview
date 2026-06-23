import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import CoursePublicationControls from "./CoursePublicationControls";

const mockRouterPost = vi.hoisted(() => vi.fn());

vi.mock("@inertiajs/react", () => ({
    router: { post: mockRouterPost },
}));

vi.mock("@mui/material", () => ({
    Button: ({ children, component: Component = "button", endIcon, startIcon, ...props }) => {
        const domProps = { ...props };
        ["color", "size", "sx", "variant"].forEach((prop) => delete domProps[prop]);
        return (
            <Component {...domProps}>
                {startIcon}
                {children}
                {endIcon}
            </Component>
        );
    },
    ListItemIcon: ({ children }) => <span>{children}</span>,
    ListItemText: ({ children }) => <span>{children}</span>,
    Menu: ({ children, open }) => (open ? <div role="menu">{children}</div> : null),
    MenuItem: ({ children, ...props }) => (
        <button role="menuitem" {...props}>
            {children}
        </button>
    ),
}));

vi.mock("@mui/icons-material", () => ({
    ExpandMore: () => <span />,
    Launch: () => <span />,
    Publish: () => <span />,
    Unpublished: () => <span />,
}));

vi.mock("./PublishValidationDialog", () => ({
    default: ({ open, onPublish }) =>
        open ? <button onClick={onPublish}>Confirm publish</button> : null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
    default: ({ open, onConfirm }) =>
        open ? <button onClick={onConfirm}>Confirm unpublish</button> : null,
}));

describe("CoursePublicationControls", () => {
    beforeEach(() => {
        mockRouterPost.mockReset();
    });

    test("publishes a draft and opens its authorized course-page preview", () => {
        render(
            <CoursePublicationControls
                program={{ id: 17, name: "AI Basics", isPublished: false }}
            />,
        );

        expect(screen.getByRole("link", { name: /view course/i })).toHaveAttribute(
            "href",
            "/instructor/programs/17/preview/",
        );

        fireEvent.click(screen.getByRole("button", { name: "Publish" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirm publish" }));

        expect(mockRouterPost).toHaveBeenCalledWith(
            "/instructor/programs/17/publish/",
            {},
            expect.any(Object),
        );
    });

    test("shows the public URL and unpublishes a live course", async () => {
        render(
            <CoursePublicationControls
                program={{ id: 21, name: "AI Basics", isPublished: true }}
            />,
        );

        expect(screen.getByRole("link", { name: /view course/i })).toHaveAttribute(
            "href",
            "/programs/21/",
        );

        fireEvent.click(screen.getByRole("button", { name: "Published" }));
        fireEvent.click(await screen.findByRole("menuitem", { name: "Unpublish" }));
        fireEvent.click(screen.getByRole("button", { name: "Confirm unpublish" }));

        expect(mockRouterPost).toHaveBeenCalledWith(
            "/instructor/programs/21/unpublish/",
            {},
            expect.any(Object),
        );
    });
});
