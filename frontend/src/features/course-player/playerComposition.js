import { ACTIVITY_TYPES, normalizeActivityType } from "@/lib/activityTypes";

const PRIMARY_BLOCK_TYPES = Object.freeze({
    [ACTIVITY_TYPES.TEXT]: ["RICHTEXT"],
    [ACTIVITY_TYPES.VIDEO]: ["VIDEO"],
    [ACTIVITY_TYPES.DOCUMENT]: ["DOCUMENT", "PDF"],
    [ACTIVITY_TYPES.AUDIO]: ["AUDIO"],
    [ACTIVITY_TYPES.CODE]: ["CODE"],
    [ACTIVITY_TYPES.QUIZ]: ["QUIZ"],
    [ACTIVITY_TYPES.ASSIGNMENT]: ["ASSIGNMENT"],
});

const hasCanonicalPrimary = (activityType, node) => {
    const properties = node?.properties || {};
    switch (activityType) {
        case ACTIVITY_TYPES.TEXT:
            return Boolean(properties.content || node?.contentHtml);
        case ACTIVITY_TYPES.VIDEO:
            return Boolean(properties.video_url);
        case ACTIVITY_TYPES.DOCUMENT:
            return Boolean(properties.document?.viewer_pdf_url);
        case ACTIVITY_TYPES.AUDIO:
            return Boolean(properties.audio_url);
        case ACTIVITY_TYPES.CODE:
            return Boolean(properties.starter_code);
        case ACTIVITY_TYPES.QUIZ:
            return Boolean(properties.quiz_id || properties.questions);
        case ACTIVITY_TYPES.ASSIGNMENT:
            return Boolean(properties.assignment_id || properties.quiz_id);
        default:
            return true;
    }
};

export const resolvePlayerComposition = (node) => {
    const activityType = normalizeActivityType(node);
    const blocks = node?.supplements || node?.blocks || [];
    if (hasCanonicalPrimary(activityType, node)) {
        return { activityType, legacyPrimaryBlock: null, supplements: blocks };
    }

    const compatibleTypes = PRIMARY_BLOCK_TYPES[activityType] || [];
    const primaryIndex = blocks.findIndex((block) =>
        compatibleTypes.includes(String(block?.type || "").toUpperCase()),
    );
    if (primaryIndex < 0) {
        return { activityType, legacyPrimaryBlock: null, supplements: blocks };
    }

    return {
        activityType,
        legacyPrimaryBlock: blocks[primaryIndex],
        supplements: blocks.filter((_, index) => index !== primaryIndex),
    };
};
