export function htmlToPlainText(value) {
    const raw = String(value || "");
    if (!raw) {
        return "";
    }

    const withoutTags = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    if (typeof document === "undefined") {
        return withoutTags;
    }

    const textarea = document.createElement("textarea");
    textarea.innerHTML = withoutTags;
    return textarea.value.replace(/\s+/g, " ").trim();
}

export function truncatePlainText(value, maxLength = 200) {
    const text = htmlToPlainText(value);
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength).trim()}...`;
}
