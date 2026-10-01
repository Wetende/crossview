// Django adds this tag to the flash message when a builder save is refused
// because a connected AI app changed the same item after it was opened.
export const EDIT_CONFLICT_TAG = "edit-conflict";

export const hasEditConflict = (page) =>
    (Array.isArray(page?.props?.flash) ? page.props.flash : []).some((message) =>
        String(message?.type || "")
            .split(/\s+/)
            .includes(EDIT_CONFLICT_TAG),
    );

const flatten = (nodes) =>
    (Array.isArray(nodes) ? nodes : []).flatMap((node) => [node, ...flatten(node.children)]);

export const findNodeVersion = (curriculum, nodeId) =>
    flatten(curriculum).find((node) => String(node.id) === String(nodeId))?.version;
