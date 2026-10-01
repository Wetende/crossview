import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import IntroVideoUrlField from "./IntroVideoUrlField";

describe("IntroVideoUrlField", () => {
    test("explains the supported sources when the link is blank or valid", () => {
        const { rerender } = render(<IntroVideoUrlField value="" onChange={vi.fn()} />);

        const input = screen.getByRole("textbox", { name: "Intro video URL" });
        expect(input).not.toHaveAttribute("aria-invalid", "true");
        expect(
            screen.getByText(/A YouTube or Vimeo video link, or a direct HTTPS \.mp4 or \.webm file/),
        ).toBeInTheDocument();

        rerender(
            <IntroVideoUrlField
                value="https://vimeo.com/76979871"
                onChange={vi.fn()}
            />,
        );
        expect(input).not.toHaveAttribute("aria-invalid", "true");
    });

    test("flags an unsupported link", () => {
        render(
            <IntroVideoUrlField value="https://example.org/about" onChange={vi.fn()} />,
        );

        expect(screen.getByRole("textbox", { name: "Intro video URL" })).toHaveAttribute(
            "aria-invalid",
            "true",
        );
        expect(
            screen.getByText("Use a YouTube or Vimeo video link, or a direct HTTPS .mp4 or .webm file."),
        ).toBeInTheDocument();
    });

    test("reports edits", () => {
        const onChange = vi.fn();
        render(<IntroVideoUrlField value="" onChange={onChange} />);

        fireEvent.change(screen.getByRole("textbox", { name: "Intro video URL" }), {
            target: { value: "https://youtu.be/dQw4w9WgXcQ" },
        });

        expect(onChange).toHaveBeenCalledWith("https://youtu.be/dQw4w9WgXcQ");
    });
});
