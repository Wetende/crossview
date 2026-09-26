import { InputRule } from "@tiptap/core";
import { BlockMath, InlineMath } from "@tiptap/extension-mathematics";

import { KATEX_OPTIONS } from "./richTextMath";

/**
 * Typing `$x^2$` creates inline maths. The opening `$` must be followed by a
 * non-space and the closing `$` preceded by one, and a bare number such as
 * `$100$` is left alone, so prices ("$5 and $10") stay text.
 */
export const INLINE_MATH_INPUT_REGEX =
    /(?<![$\\])\$(?!\d+(?:[.,]\d+)?\$)([^\s$](?:[^$\n]*[^\s$\\])?)\$$/;

/** Typing `$$...$$` as a whole line creates block (display) maths. */
export const BLOCK_MATH_INPUT_REGEX = /^\$\$([^$\n]+)\$\$$/;

const RichTextInlineMath = InlineMath.extend({
    addInputRules() {
        return [
            new InputRule({
                find: INLINE_MATH_INPUT_REGEX,
                handler: ({ state, range, match }) => {
                    state.tr.replaceWith(
                        range.from,
                        range.to,
                        this.type.create({ latex: match[1] }),
                    );
                },
            }),
        ];
    },
});

const RichTextBlockMath = BlockMath.extend({
    addInputRules() {
        return [
            new InputRule({
                find: BLOCK_MATH_INPUT_REGEX,
                handler: ({ state, range, match }) => {
                    const latex = match[1].trim();
                    if (!latex) return null;

                    const { tr } = state;
                    const node = this.type.create({ latex });
                    const $from = tr.doc.resolve(range.from);
                    const replacesWholeBlock =
                        $from.depth > 0 &&
                        range.from === $from.start() &&
                        range.to === $from.end() &&
                        $from
                            .node(-1)
                            .canReplaceWith(
                                $from.index(-1),
                                $from.index(-1) + 1,
                                this.type,
                            );

                    if (replacesWholeBlock) {
                        tr.replaceWith($from.before(), $from.after(), node);
                    } else {
                        tr.replaceWith(range.from, range.to, node);
                    }
                    return undefined;
                },
            }),
        ];
    },
});

/**
 * Inline and block maths nodes for the shared rich-text editor.
 * `onEdit({ type, latex, pos })` is called when an author clicks a formula.
 */
export const createRichTextMathExtensions = ({ onEdit } = {}) => [
    RichTextInlineMath.configure({
        katexOptions: { ...KATEX_OPTIONS, displayMode: false },
        onClick: onEdit
            ? (node, pos) =>
                  onEdit({ type: "inline", latex: node.attrs.latex, pos })
            : undefined,
    }),
    RichTextBlockMath.configure({
        katexOptions: { ...KATEX_OPTIONS, displayMode: true },
        onClick: onEdit
            ? (node, pos) =>
                  onEdit({ type: "block", latex: node.attrs.latex, pos })
            : undefined,
    }),
];
