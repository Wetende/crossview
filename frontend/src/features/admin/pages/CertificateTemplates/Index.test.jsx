import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CertificateTemplatesIndex from "./Index";

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    router: {
        post: vi.fn(),
        visit: vi.fn(),
    },
}));

vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/features/certifications/components/CertificateCanvas", () => ({
    default: () => <div>Certificate preview</div>,
}));

describe("certificate template gallery navigation", () => {
    beforeEach(async () => {
        const { router } = await import("@inertiajs/react");
        router.visit.mockClear();
    });

    it("uses Inertia when switching to certificate linking", async () => {
        const { router } = await import("@inertiajs/react");
        render(<CertificateTemplatesIndex />);

        fireEvent.click(screen.getByRole("tab", { name: "Link certificates" }));

        expect(router.visit).toHaveBeenCalledWith(
            "/admin/certificate-templates/?tab=link",
            {
                replace: true,
                preserveState: true,
                preserveScroll: true,
            },
        );
    });
});
