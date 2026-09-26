import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

import { htmlToPlainText } from "@/utils/htmlText";
import {
    RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
    renderRichTextImageCaptions,
} from "@/utils/richTextImages";

/**
 * Maths in rich text is stored the way @tiptap/extension-mathematics writes it:
 * `<span data-type="inline-math" data-latex="...">` and
 * `<div data-type="block-math" data-latex="...">`. Display code sanitises the
 * HTML first, then renders the LaTeX source with KaTeX. KaTeX is loaded only
 * when the content contains maths.
 */
export const RICH_TEXT_MATH_SELECTOR =
    '[data-type="inline-math"], [data-type="block-math"]';

const MATH_MARKER = /data-type\s*=\s*["']?(?:inline|block)-math\b/i;

// trust stays false: \href, \url, \includegraphics and friends are refused.
export const KATEX_OPTIONS = Object.freeze({
    throwOnError: false,
    trust: false,
    strict: "ignore",
    maxSize: 20,
    maxExpand: 1000,
});

export const hasRichTextMath = (html) => MATH_MARKER.test(String(html || ""));

/** False for an empty editor value such as `<p></p>` or `<p><br></p>`. */
export const hasRichTextContent = (html) => {
    const value = String(html || "");
    if (!value.trim()) return false;
    if (/<img\b|\bdata-latex\s*=/i.test(value)) return true;
    return htmlToPlainText(value).length > 0;
};

export const sanitizeRichTextHtml = (html) =>
    renderRichTextImageCaptions(
        DOMPurify.sanitize(String(html || ""), {
            ADD_ATTR: RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
        }),
    );

let loadedKatex = null;
let katexPromise = null;

export const loadKatex = () => {
    if (!katexPromise) {
        katexPromise = Promise.all([
            import("katex"),
            import("katex/dist/katex.min.css"),
        ])
            .then(([module]) => {
                loadedKatex = module.default ?? module;
                return loadedKatex;
            })
            .catch((error) => {
                katexPromise = null;
                throw error;
            });
    }
    return katexPromise;
};

const renderLatex = (katex, latex, displayMode) => {
    try {
        return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode });
    } catch {
        return null;
    }
};

/**
 * Render maths placeholders in already-sanitised HTML. Without KaTeX (still
 * loading, or failed) each placeholder shows its LaTeX source as plain text.
 */
export const renderRichTextMath = (sanitizedHtml, katex) => {
    if (!hasRichTextMath(sanitizedHtml) || typeof document === "undefined") {
        return sanitizedHtml || "";
    }

    const template = document.createElement("template");
    template.innerHTML = sanitizedHtml;
    template.content
        .querySelectorAll(RICH_TEXT_MATH_SELECTOR)
        .forEach((element) => {
            const latex = element.getAttribute("data-latex") || "";
            const displayMode =
                element.getAttribute("data-type") === "block-math";
            const rendered = katex
                ? renderLatex(katex, latex, displayMode)
                : null;
            if (rendered === null) {
                element.textContent = latex;
            } else {
                element.innerHTML = rendered;
            }
        });
    return template.innerHTML;
};

/** Returns sanitised HTML with its maths rendered once KaTeX is available. */
export const useRichTextMath = (sanitizedHtml) => {
    const needsMath = hasRichTextMath(sanitizedHtml);
    const [katex, setKatex] = useState(() => loadedKatex);

    useEffect(() => {
        if (!needsMath || katex) return undefined;
        let active = true;
        loadKatex()
            .then((module) => {
                if (active) setKatex(() => module);
            })
            .catch(() => {
                // Keep showing the LaTeX source.
            });
        return () => {
            active = false;
        };
    }, [needsMath, katex]);

    return useMemo(
        () =>
            needsMath
                ? renderRichTextMath(sanitizedHtml, katex)
                : sanitizedHtml || "",
        [needsMath, sanitizedHtml, katex],
    );
};
