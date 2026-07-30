import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import CertificateCanvas from "./CertificateCanvas";

describe("CertificateCanvas", () => {
    test("renders a real verification QR code in the browser preview", () => {
        render(
            <CertificateCanvas
                layout={{
                    background: { color: "#ffffff" },
                    elements: [
                        {
                            id: "verification-qr",
                            type: "qr_code",
                            x: 10,
                            y: 10,
                            width: 30,
                            height: 30,
                            styles: {
                                foreground: "#172033",
                                background: "#ffffff",
                                errorCorrection: "H",
                                padding: 1.5,
                            },
                        },
                    ],
                }}
            />,
        );

        expect(
            screen.getByTitle("Certificate verification QR code"),
        ).toBeInTheDocument();
    });
});
