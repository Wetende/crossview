const CORE_BUILDER_TABS = [
    { label: "Curriculum", value: "curriculum" },
    { label: "Settings", value: "settings" },
    { label: "Pricing", value: "pricing" },
    { label: "FAQ", value: "faq" },
    { label: "Notice", value: "notice" },
];

const PRACTICUM_BUILDER_TAB = { label: "Practicum", value: "practicum" };
export const SETTINGS_SECTIONS = [
    { label: "Main", value: "main" },
    { label: "Academic Details", value: "academic" },
    { label: "Access", value: "access" },
    { label: "Prerequisites", value: "prerequisites" },
    { label: "Course files", value: "files" },
    { label: "Reviews", value: "reviews" },
    { label: "Certificate", value: "certificate" },
];

const SETTINGS_SECTION_VALUES = new Set(
    SETTINGS_SECTIONS.map((section) => section.value),
);

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

export const getSettingsSectionUrl = (programId, sectionValue = "main") => {
    const section = normalizeSettingsSection(sectionValue);
    return `/instructor/programs/${programId}/manage/?tab=settings&section=${section}`;
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

export const normalizeSettingsSection = (requestedSection) => {
    const sectionValue = requestedSection || "main";
    return SETTINGS_SECTION_VALUES.has(sectionValue) ? sectionValue : "main";
};

export const getRequestedSettingsSection = () => {
    if (typeof window === "undefined") {
        return "main";
    }
    return normalizeSettingsSection(
        new URLSearchParams(window.location.search).get("section"),
    );
};
