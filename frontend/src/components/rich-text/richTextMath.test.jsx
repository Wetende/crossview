import { render, screen, waitFor } from "@testing-library/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";
import { describe, expect, test } from "vitest";

import RichTextContent from "./RichTextContent";
import {
    hasRichTextMath,
    renderRichTextMath,
    sanitizeRichTextHtml,
} from "./richTextMath";
import {
    BLOCK_MATH_INPUT_REGEX,
    INLINE_MATH_INPUT_REGEX,
    createRichTextMathExtensions,
} from "./richTextMathExtensions";

const inlineMath = (latex) =>
    `<span data-type="inline-math" data-latex="${latex}"></span>`;

const toFragment = (html) => {
    const template = document.createElement("template");
    template.innerHTML = html;
    return template.content;
};

describe("rich text maths display", () => {
    test("detects inline and block maths placeholders", () => {
        expect(hasRichTextMath(`<p>${inlineMath("x")}</p>`)).toBe(true);
        expect(
            hasRichTextMath(
                '<div data-type="block-math" data-latex="y"></div>',
            ),
        ).toBe(true);
        expect(hasRichTextMath("<p>Costs $5 and $10.</p>")).toBe(false);
    });

    test("keeps the LaTeX source through sanitisation and renders it with KaTeX", () => {
        const html = sanitizeRichTextHtml(
            `<p>Area ${inlineMath("\\pi r^2")}</p><div data-type="block-math" data-latex="\\frac{a}{b}"></div>`,
        );
        expect(html).toContain('data-latex="\\pi r^2"');

        const fragment = toFragment(renderRichTextMath(html, katex));

        const inline = fragment.querySelector('[data-type="inline-math"]');
        expect(inline.querySelector(".katex")).not.toBeNull();
        expect(inline.querySelector(".katex-display")).toBeNull();
        const block = fragment.querySelector('[data-type="block-math"]');
        expect(block.querySelector(".katex-display")).not.toBeNull();
    });

    test("shows the LaTeX source until KaTeX has loaded", () => {
        const html = renderRichTextMath(`<p>${inlineMath("x^2")}</p>`, null);

        expect(toFragment(html).textContent).toBe("x^2");
    });

    test("an XSS attempt inside maths is rendered as inert text", () => {
        const attempts = [
            "&lt;img src=x onerror=alert(1)&gt;",
            "\\href{javascript:alert(1)}{click}",
            "&lt;/span&gt;&lt;script&gt;alert(1)&lt;/script&gt;",
            "&quot; onmouseover=&quot;alert(1)",
        ];
        const html = renderRichTextMath(
            sanitizeRichTextHtml(
                `<p>${attempts.map(inlineMath).join(" ")}</p><img src=x onerror="alert(2)"><script>alert(3)</script>`,
            ),
            katex,
        );
        const fragment = toFragment(html);

        expect(fragment.querySelectorAll("script")).toHaveLength(0);
        expect(
            fragment.querySelectorAll("[onerror], [onmouseover]"),
        ).toHaveLength(0);
        expect(fragment.querySelectorAll('a[href^="javascript"]')).toHaveLength(
            0,
        );
        expect(fragment.querySelectorAll("img")).toHaveLength(1);
        expect(
            fragment.querySelector("img").getAttribute("onerror"),
        ).toBeNull();
        expect(
            fragment.querySelectorAll('[data-type="inline-math"]'),
        ).toHaveLength(4);
    });

    test("RichTextContent renders maths lazily and sanitises content", async () => {
        const { container } = render(
            <RichTextContent
                html={`<p>Energy ${inlineMath("E=mc^2")}</p><script>window.hacked = true</script>`}
                data-testid="content"
            />,
        );

        expect(screen.getByTestId("content")).toHaveTextContent("Energy");
        await waitFor(
            () => expect(container.querySelector(".katex")).not.toBeNull(),
            { timeout: 15000 },
        );
        expect(container.querySelector("script")).toBeNull();
        expect(window.hacked).toBeUndefined();
    });

    test("RichTextContent renders nothing for an empty editor value", () => {
        const { container } = render(<RichTextContent html="" />);

        expect(container).toBeEmptyDOMElement();
    });
});

describe("rich text maths editing", () => {
    test("inline $...$ input rule matches maths but not prices", () => {
        const match = "Area is $\\pi r^2$".match(INLINE_MATH_INPUT_REGEX);
        expect(match?.[1]).toBe("\\pi r^2");
        expect("$x$".match(INLINE_MATH_INPUT_REGEX)?.[1]).toBe("x");
        expect("It costs $5 and $".match(INLINE_MATH_INPUT_REGEX)).toBeNull();
        expect("Pay $100$".match(INLINE_MATH_INPUT_REGEX)).toBeNull();
        expect("$ x$".match(INLINE_MATH_INPUT_REGEX)).toBeNull();
        expect("$$x$".match(INLINE_MATH_INPUT_REGEX)).toBeNull();
    });

    test("block $$...$$ input rule matches a whole line", () => {
        expect("$$\\sum_i x_i$$".match(BLOCK_MATH_INPUT_REGEX)?.[1]).toBe(
            "\\sum_i x_i",
        );
        expect("Total $$x$$".match(BLOCK_MATH_INPUT_REGEX)).toBeNull();
    });

    const typeAtEnd = (editor, text) => {
        editor.commands.focus("end");
        const { view } = editor;
        const { from, to } = view.state.selection;
        const handled = view.someProp("handleTextInput", (handler) =>
            handler(view, from, to, text),
        );
        if (!handled) view.dispatch(view.state.tr.insertText(text, from, to));
    };

    test("typing the closing $ turns the text into maths nodes", () => {
        const editor = new Editor({
            extensions: [StarterKit, ...createRichTextMathExtensions()],
            content: "<p>Area is $\\pi r^2</p>",
        });
        typeAtEnd(editor, "$");
        expect(editor.getHTML()).toBe(
            '<p>Area is <span data-latex="\\pi r^2" data-type="inline-math"></span></p>',
        );

        editor.commands.setContent("<p>Costs $5 and</p>");
        typeAtEnd(editor, " ");
        typeAtEnd(editor, "$");
        expect(editor.getHTML()).toBe("<p>Costs $5 and $</p>");

        editor.commands.setContent("<p>Intro</p><p>$$a^2+b^2$</p>");
        typeAtEnd(editor, "$");
        // The paragraph is replaced (StarterKit keeps a trailing paragraph).
        expect(editor.getHTML()).toBe(
            '<p>Intro</p><div data-latex="a^2+b^2" data-type="block-math"></div><p></p>',
        );
        editor.destroy();
    });

    test("the editor stores LaTeX source in the HTML the display renders", () => {
        const editor = new Editor({
            extensions: [StarterKit, ...createRichTextMathExtensions()],
            content: `<p>Area ${inlineMath("\\pi r^2")}</p><div data-type="block-math" data-latex="a^2+b^2"></div>`,
        });

        const stored = editor.getHTML();
        editor.destroy();

        expect(stored).toContain('data-type="inline-math"');
        expect(stored).toContain('data-latex="\\pi r^2"');
        expect(stored).toContain('data-type="block-math"');
        const fragment = toFragment(
            renderRichTextMath(sanitizeRichTextHtml(stored), katex),
        );
        expect(fragment.querySelectorAll(".katex")).toHaveLength(2);
    });
});
