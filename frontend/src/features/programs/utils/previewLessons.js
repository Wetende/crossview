/**
 * Return the preview URL of the first free preview lesson, in curriculum order.
 * The server only sets `previewUrl` on lessons visitors are allowed to open.
 */
export const findFirstPreviewUrl = (curriculum) => {
    for (const item of curriculum || []) {
        if (item?.previewUrl) return item.previewUrl;
        const nested = findFirstPreviewUrl(item?.children);
        if (nested) return nested;
    }
    return null;
};
