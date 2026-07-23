import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import {
    createTheme,
    ThemeProvider as MuiThemeProvider,
    useTheme,
} from "@mui/material/styles";

import DashboardLayout from "./index";
import { COLORS } from "@/theme/palette";

const {
    mockUsePage,
    mockUseLogoutOptions,
    mockSharedLogoutAction,
    mockToggleMode,
} = vi.hoisted(() => ({
    mockUsePage: vi.fn(),
    mockUseLogoutOptions: vi.fn(),
    mockSharedLogoutAction: vi.fn(),
    mockToggleMode: vi.fn(),
}));

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => mockUsePage(),
}));

vi.mock("@/hooks/useLogout", () => ({
    default: (options = {}) => {
        mockUseLogoutOptions(options);
        return () => {
            options.onBefore?.();
            mockSharedLogoutAction();
        };
    },
}));

vi.mock("@/components/NotificationPanel", () => ({
    default: () => <div data-testid="notification-panel" />,
}));

vi.mock("@/components/MessageUnreadBadge", () => ({
    default: () => <div data-testid="message-unread-badge" />,
}));

vi.mock("@/components/common/PlatformLogo", () => ({
    default: () => <div data-testid="platform-logo" />,
}));

vi.mock("@/theme", () => ({
    useThemeMode: () => ({ isDark: false, toggleMode: mockToggleMode }),
}));

describe("DashboardLayout logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        mockUsePage.mockReturnValue({
            props: {
                auth: {
                    user: {
                        firstName: "Ada",
                        email: "ada@example.com",
                        role: "student",
                    },
                },
                platform: {
                    institutionName: "Learning Management System",
                    features: {},
                },
            },
        });
    });

    test("dashboard logout control triggers the shared logout action", () => {
        render(
            <DashboardLayout>
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        fireEvent.click(screen.getByLabelText("user menu"));
        fireEvent.click(screen.getByRole("menuitem", { name: "Logout" }));

        expect(mockUseLogoutOptions).toHaveBeenCalled();
        expect(mockSharedLogoutAction).toHaveBeenCalledTimes(1);
    });

    test("sidebar logout uses the shared logout action", () => {
        render(
            <DashboardLayout>
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        fireEvent.click(screen.getAllByRole("button", { name: "Logout" })[0]);

        expect(mockSharedLogoutAction).toHaveBeenCalledTimes(1);
    });

    test("marks the current route and persists the collapsed sidebar state", async () => {
        window.history.pushState({}, "", "/dashboard/");
        render(
            <DashboardLayout>
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        expect(
            screen
                .getAllByRole("link", { name: "Dashboard" })
                .some((link) => link.getAttribute("aria-current") === "page"),
        ).toBe(true);

        fireEvent.click(screen.getByLabelText("Collapse sidebar"));
        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenLastCalledWith(
                "dashboard_sidebar_collapsed",
                "true",
            );
        });
    });

    test("retains the dark mode toggle", () => {
        render(
            <DashboardLayout>
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        fireEvent.click(screen.getByLabelText("toggle dark mode"));
        expect(mockToggleMode).toHaveBeenCalledTimes(1);
    });

    test("uses the product dashboard palette and typography instead of runtime branding", () => {
        const ThemeProbe = () => {
            const theme = useTheme();
            return (
                <>
                    <span data-testid="dashboard-primary">
                        {theme.palette.primary.main}
                    </span>
                    <span data-testid="dashboard-heading-font">
                        {theme.typography.h4.fontFamily}
                    </span>
                </>
            );
        };
        const runtimeTheme = createTheme({
            palette: { primary: { main: "#FF00FF" } },
        });

        render(
            <MuiThemeProvider theme={runtimeTheme}>
                <DashboardLayout>
                    <ThemeProbe />
                </DashboardLayout>
            </MuiThemeProvider>,
        );

        expect(screen.getByTestId("dashboard-primary")).toHaveTextContent(
            COLORS.PRIMARY,
        );
        expect(screen.getByTestId("dashboard-heading-font")).toHaveTextContent(
            "Archivo",
        );
    });

    test("dashboard menu closes immediately when logout is clicked", async () => {
        render(
            <DashboardLayout>
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        fireEvent.click(screen.getByLabelText("user menu"));
        expect(
            within(screen.getByRole("menu")).getByRole("menuitem", {
                name: "Logout",
            }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("menuitem", { name: "Logout" }));

        await waitFor(() => {
            expect(
                screen.queryByRole("menuitem", { name: "Logout" }),
            ).not.toBeInTheDocument();
        });
    });

    test("locked deployments hide the admin settings entry points", () => {
        mockUsePage.mockReturnValue({
            props: {
                auth: {
                    user: {
                        firstName: "Ada",
                        email: "ada@example.com",
                        role: "admin",
                    },
                },
                platform: {
                    institutionName: "Learning Platform",
                    features: {},
                    capabilities: { showAdminSettings: false },
                },
            },
        });

        render(
            <DashboardLayout>
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        expect(
            screen.queryByRole("link", { name: "General" }),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("user menu"));
        expect(
            screen.queryByRole("menuitem", { name: "Settings" }),
        ).not.toBeInTheDocument();
    });

    test("admin navigation manages instructors through users without a vetting queue", () => {
        mockUsePage.mockReturnValue({
            props: {
                auth: {
                    user: {
                        firstName: "Ada",
                        email: "ada@example.com",
                        role: "admin",
                    },
                },
                platform: {
                    institutionName: "Learning Platform",
                    features: {},
                },
            },
        });

        render(
            <DashboardLayout role="admin">
                <div>Dashboard content</div>
            </DashboardLayout>,
        );

        expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
        expect(
            screen.queryByText("Instructor Vetting"),
        ).not.toBeInTheDocument();
    });
});
