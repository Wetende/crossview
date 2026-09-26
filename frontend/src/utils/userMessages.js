const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

const TECHNICAL_PATTERNS = [
    /traceback/i,
    /exception/i,
    /stack\s*trace/i,
    /sql/i,
    /integrityerror/i,
    /keyerror/i,
    /valueerror/i,
    /typeerror/i,
    /\bfile\s+".*",\s+line\s+\d+/i,
];

function isMeaningfulMessage(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function looksTechnical(message) {
    if (!isMeaningfulMessage(message)) return false;
    return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

function sanitizeMessage(message, fallback = DEFAULT_ERROR_MESSAGE) {
    if (!isMeaningfulMessage(message)) return fallback;
    const cleaned = String(message).trim();
    if (looksTechnical(cleaned)) return fallback;
    return cleaned;
}

function extractFromObject(payload) {
    if (!payload || typeof payload !== "object") return null;

    if (isMeaningfulMessage(payload.error)) return payload.error;
    if (isMeaningfulMessage(payload.message)) return payload.message;
    if (isMeaningfulMessage(payload.detail)) return payload.detail;

    const values = Object.values(payload)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value) => typeof value === "string" && value.trim().length > 0);

    if (values.length > 0) {
        return values.join(" ");
    }

    return null;
}

export function getUserErrorMessage(input, fallback = DEFAULT_ERROR_MESSAGE) {
    if (isMeaningfulMessage(input)) {
        return sanitizeMessage(input, fallback);
    }

    if (Array.isArray(input)) {
        return sanitizeMessage(input.filter(Boolean).join(" "), fallback);
    }

    const responseData = input?.response?.data;
    if (responseData) {
        return sanitizeMessage(extractFromObject(responseData), fallback);
    }

    const objectMessage = extractFromObject(input);
    if (objectMessage) {
        return sanitizeMessage(objectMessage, fallback);
    }

    if (isMeaningfulMessage(input?.message)) {
        return sanitizeMessage(input.message, fallback);
    }

    return fallback;
}

export function getFlashSeverity(type) {
    // Django puts extra tags before the level ("edit-conflict error").
    const tokens = String(type || "")
        .toLowerCase()
        .split(" ")
        .filter(Boolean);

    if (tokens.includes("error") || tokens.includes("danger")) return "error";
    if (tokens.includes("warning")) return "warning";
    if (tokens.includes("success")) return "success";
    return "info";
}

export function getFlashMessages(flash) {
    if (Array.isArray(flash)) return flash;
    if (!flash || typeof flash !== "object") return [];

    const messages = [];
    if (isMeaningfulMessage(flash.success)) {
        messages.push({ type: "success", message: flash.success });
    }
    if (isMeaningfulMessage(flash.error)) {
        messages.push({ type: "error", message: flash.error });
    }
    if (isMeaningfulMessage(flash.warning)) {
        messages.push({ type: "warning", message: flash.warning });
    }
    if (isMeaningfulMessage(flash.info)) {
        messages.push({ type: "info", message: flash.info });
    }

    return messages;
}
