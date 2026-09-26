import { render, screen } from "@testing-library/react";
import { useTheme } from "@mui/material/styles";
import { describe, expect, test, vi } from "vitest";

import { FONT_FIGTREE } from "@/config";
import ClassroomLayout from "./ClassroomLayout";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const ThemeProbe = () => {
    const theme = useTheme();
    return (
        <span data-testid="theme-probe">
            {theme.typography.h1.fontFamily}|
            {theme.components?.MuiButton ? "overrides" : "no-overrides"}
        </span>
    );
};

const renderLayout = (props = {}) =>
    render(
        <ClassroomLayout
            programTitle="DevOps Engineering Mastery"
            backLink="/dashboard/"
            LeftPanel={<div>Curriculum panel</div>}
            RightPanel={<div>Study panel</div>}
            isSidebarOpen={false}
            onToggleSidebar={vi.fn()}
            isDiscussionsOpen={false}
            onToggleDiscussions={vi.fn()}
            {...props}
        >
            <ThemeProbe />
        </ClassroomLayout>,
    );

describe("ClassroomLayout", () => {
    test("shows the message instructor shortcut only when a link is given", () => {
        const href = "/messages/new/?recipient_id=7&draft=Hello";
        const view = renderLayout({ messageInstructorHref: href });

        expect(
            screen.getByRole("link", { name: "Message instructor" }),
        ).toHaveAttribute("href", href);

        view.unmount();
        renderLayout();

        expect(
            screen.queryByRole("link", { name: "Message instructor" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Discussions" }),
        ).toBeInTheDocument();
    });

    test("uses the body font for headings and keeps component overrides", () => {
        renderLayout();

        expect(screen.getByTestId("theme-probe")).toHaveTextContent(
            `${FONT_FIGTREE}|overrides`,
        );
    });
});
