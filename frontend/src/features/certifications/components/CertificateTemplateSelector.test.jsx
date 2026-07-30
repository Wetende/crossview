import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import CertificateTemplateSelector from "./CertificateTemplateSelector";

const templates = [
    {
        name: "Classic Formal",
        templateVersionId: 11,
        orientation: "landscape",
        widthMm: 297,
        heightMm: 210,
        layout: {
            background: { color: "#fffaf0" },
            elements: [],
        },
    },
    {
        name: "Academic Gold",
        templateVersionId: 12,
        orientation: "portrait",
        widthMm: 210,
        heightMm: 297,
        layout: {
            background: { color: "#fffdf8" },
            elements: [],
        },
    },
];

describe("CertificateTemplateSelector", () => {
    test("selects a certificate from visual tiles", () => {
        const onChange = vi.fn();

        render(
            <CertificateTemplateSelector
                templates={templates}
                value={11}
                defaultTemplateVersionId={12}
                defaultTemplateName="Academic Gold"
                defaultSource="category"
                onChange={onChange}
            />,
        );

        expect(
            screen.getByRole("button", {
                name: "Select Classic Formal certificate",
            }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByText("Inherited from category")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", {
                name: "Select Academic Gold certificate",
            }),
        );

        expect(onChange).toHaveBeenCalledWith(12);
    });

    test("previews a certificate without changing the selection", () => {
        const onChange = vi.fn();

        render(
            <CertificateTemplateSelector
                templates={templates}
                value=""
                defaultTemplateVersionId={11}
                defaultTemplateName="Classic Formal"
                defaultSource="default"
                onChange={onChange}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Preview Academic Gold certificate",
            }),
        );

        expect(
            screen.getByRole("dialog", {
                name: "Certificate preview: Academic Gold",
            }),
        ).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });
});
