import { render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { describe, expect, test, vi } from "vitest";

import palette from "@/theme/palette";
import DashboardSidebar from "./DashboardSidebar";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

const Icon = () => <span />;
const navigation = [
    {
        title: "Main",
        items: [{ label: "Home", href: "/dashboard/", icon: Icon }],
    },
];

const renderSidebar = (mode) =>
    render(
        <ThemeProvider theme={createTheme({ palette: palette(mode) })}>
            <DashboardSidebar
                collapsed={false}
                currentPath="/dashboard/"
                isMobile={false}
                navigation={navigation}
                onLogout={() => {}}
                onNavigate={() => {}}
            />
        </ThemeProvider>,
    );

const sidebarRoot = () =>
    screen.getByRole("navigation", { name: "Dashboard navigation" })
        .parentElement;

describe("DashboardSidebar", () => {
    test("uses the neutral charcoal background in dark mode", () => {
        renderSidebar("dark");
        expect(sidebarRoot()).toHaveStyle({
            backgroundColor: "rgb(16, 24, 40)",
        });
    });

    test("keeps the brand background in light mode", () => {
        renderSidebar("light");
        expect(sidebarRoot()).toHaveStyle({
            backgroundColor: "rgb(22, 101, 52)",
        });
    });
});
