const CORE_BUILDER_TABS = [
    { label: "Overview", value: "overview" },
    { label: "Curriculum", value: "curriculum" },
    { label: "Settings", value: "settings" },
    { label: "Pricing", value: "pricing" },
    { label: "FAQ", value: "faq" },
    { label: "Notice", value: "notice" },
    { label: "Drip", value: "drip" },
    { label: "Prerequisites", value: "prerequisites" },
    { label: "Access", value: "access" },
];

const PRACTICUM_BUILDER_TAB = { label: "Practicum", value: "practicum" };

const BUILDER_TAB_VALUES = new Set([
    ...CORE_BUILDER_TABS.map((tab) => tab.value),
    PRACTICUM_BUILDER_TAB.value,
]);

export const isPracticumTabEnabled = (program) => {
    const blueprintFlags = program?.blueprint?.featureFlags || {};
    return Boolean(blueprintFlags.practicum || blueprintFlags.portfolio);
};

export const getBuilderTabUrl = (programId, tabValue) => {
    const manageUrl = `/instructor/programs/${programId}/manage/`;
    return tabValue === "curriculum" ? manageUrl : `${manageUrl}?tab=${tabValue}`;
};

export const getAvailableBuilderTabs = (program) => {
    const tabs = [...CORE_BUILDER_TABS];
    if (isPracticumTabEnabled(program)) {
        tabs.push(PRACTICUM_BUILDER_TAB);
    }

    return tabs.map((tab) => ({
        ...tab,
        href: getBuilderTabUrl(program.id, tab.value),
    }));
};

export const normalizeBuilderTab = (program, requestedTab) => {
    const tabValue = requestedTab || "curriculum";
    if (!BUILDER_TAB_VALUES.has(tabValue)) {
        return "curriculum";
    }
    if (tabValue === "practicum" && !isPracticumTabEnabled(program)) {
        return "curriculum";
    }
    return tabValue;
};

export const getRequestedBuilderTab = () => {
    if (typeof window === "undefined") {
        return "curriculum";
    }
    return new URLSearchParams(window.location.search).get("tab") || "curriculum";
};
