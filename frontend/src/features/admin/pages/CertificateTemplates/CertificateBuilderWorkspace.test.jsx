import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CertificateBuilderWorkspace, {
    CertificateCanvasRulers,
} from "./CertificateBuilderWorkspace";

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
        expect(
            screen.getByRole("link", {
                name: "Back to certificate dashboard",
            }),
        ).toHaveAttribute("href", "/admin/certificate-templates/");
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

        expect(screen.getByTestId("horizontal-ruler")).toBeInTheDocument();
        expect(screen.getByTestId("vertical-ruler")).toBeInTheDocument();
        expect(screen.getByText("Certificate canvas")).toBeInTheDocument();
    });
});
