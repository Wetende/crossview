import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import Landing from "./Landing";

const { mockUsePage, mockUseLogoutCalls, mockSharedLogoutAction } = vi.hoisted(
    () => ({
        mockUsePage: vi.fn(),
        mockUseLogoutCalls: vi.fn(),
        mockSharedLogoutAction: vi.fn(),
    })
);

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => mockUsePage(),
}));

vi.mock("@/hooks/useLogout", () => ({
    default: () => {
        mockUseLogoutCalls();
        return (options = {}) => {
            options.onBefore?.();
            mockSharedLogoutAction();
        };
    },
}));

vi.mock("@/components/common/VisuallyHidden", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/LazySection", () => ({
    default: () => <div data-testid="lazy-section" />,
}));

vi.mock("@/components/common/PlatformLogo", () => ({
    default: () => <div data-testid="platform-logo" />,
}));

vi.mock("@/features/components/common/ButtonAnimationWrapper", () => ({
    default: ({ children }) => <>{children}</>,
}));

vi.mock("@/components/sections/landing/HeroSection", () => ({
    default: () => <div data-testid="hero-section" />,
}));

vi.mock("@/components/common/Footer", () => ({
    default: () => <div data-testid="footer" />,
}));

describe("Landing logout controls", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePage.mockReturnValue({
            props: {
                platform: {
                    institutionName: "DigikaTech Africa",
                    primaryColor: "#3B82F6",
                    secondaryColor: "#1E40AF",
                },
                programs: [],
                stats: {},
                auth: {
                    user: {
                        email: "ada@example.com",
                        role: "student",
                        first_name: "Ada",
                        last_name: "Lovelace",
                    },
                },
            },
        });
    });

    test("public desktop logout control triggers shared logout action", () => {
        render(<Landing />);

        fireEvent.click(screen.getByLabelText("open user menu"));
        fireEvent.click(screen.getByText("Logout"));

        expect(mockUseLogoutCalls).toHaveBeenCalled();
        expect(mockSharedLogoutAction).toHaveBeenCalledTimes(1);
    });

    test("public mobile logout control triggers shared logout action", () => {
        render(<Landing />);

        fireEvent.click(screen.getByLabelText("open mobile menu"));
        fireEvent.click(screen.getByRole("button", { name: "Logout" }));

        expect(mockUseLogoutCalls).toHaveBeenCalled();
        expect(mockSharedLogoutAction).toHaveBeenCalledTimes(1);
    });
});
