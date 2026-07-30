import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CertificateBuilderWorkspace, {
    CertificateCanvasRulers,
} from "./CertificateBuilderWorkspace";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, ...props }) => (
        <a data-inertia-link="true" {...props}>
            {children}
        </a>
    ),
}));

describe("certificate builder workspace", () => {
    it("owns the viewport and returns to the certificate dashboard", () => {
        render(
            <CertificateBuilderWorkspace
                backHref="/admin/certificate-templates/"
                navigation={<span>Certificates</span>}
            >
                <div>Editor</div>
            </CertificateBuilderWorkspace>,
        );

        expect(screen.getByTestId("certificate-builder-workspace")).toHaveStyle(
            {
                height: "100dvh",
                overflow: "hidden",
            },
        );
        expect(screen.getByTestId("certificate-builder-header")).toHaveStyle({
            backgroundColor: "#eef2f7",
        });
        const backLink = screen.getByRole("link", {
            name: "Back to certificate dashboard",
        });
        expect(backLink).toHaveAttribute("data-inertia-link", "true");
        expect(backLink).toHaveAttribute(
            "href",
            "/admin/certificate-templates/",
        );
        expect(
            screen.getByRole("main", {
                name: "Certificate builder workspace",
            }),
        ).toHaveTextContent("Editor");
    });

    it("frames the canvas with horizontal and vertical rulers", () => {
        render(
            <CertificateCanvasRulers>
                <div>Certificate canvas</div>
            </CertificateCanvasRulers>,
        );

        const horizontalRuler = screen.getByTestId("horizontal-ruler");
        const verticalRuler = screen.getByTestId("vertical-ruler");

        expect(horizontalRuler).toHaveStyle({
            backgroundColor: "#ffffff",
            backgroundRepeat: "repeat-x",
        });
        expect(verticalRuler).toHaveStyle({
            backgroundColor: "#ffffff",
            backgroundRepeat: "repeat-y",
        });
        expect(within(horizontalRuler).getByText("1600")).toBeInTheDocument();
        expect(within(verticalRuler).getByText("1100")).toBeInTheDocument();
        expect(screen.getByText("Certificate canvas")).toBeInTheDocument();
    });
});
