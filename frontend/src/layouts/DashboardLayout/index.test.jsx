import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";

import DashboardLayout from "./index";

const { mockUsePage, mockUseLogoutOptions, mockSharedLogoutAction } =
    vi.hoisted(() => ({
        mockUsePage: vi.fn(),
        mockUseLogoutOptions: vi.fn(),
        mockSharedLogoutAction: vi.fn(),
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
    useThemeMode: () => ({ isDark: false, toggleMode: vi.fn() }),
}));

describe("DashboardLayout logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
                    institutionName: "DigikaTech Africa",
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
});
