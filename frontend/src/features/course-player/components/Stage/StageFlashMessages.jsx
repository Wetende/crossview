import { PLAYER_RADII } from "../../playerRadii";
import { useState } from "react";
import { Alert, Stack } from "@mui/material";

import { getFlashMessages, getFlashSeverity } from "@/utils/userMessages";

/**
 * Dismissible server flash messages for player views without the study panel
 * (overview and summaries). Dismissals reset whenever a response brings a new
 * flash payload.
 */
const StageFlashMessages = ({ flash }) => {
    const [dismissal, setDismissal] = useState({ source: flash, indexes: [] });
    if (dismissal.source !== flash) {
        setDismissal({ source: flash, indexes: [] });
    }

    const messages = getFlashMessages(flash)
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.message && !dismissal.indexes.includes(item.index));
    if (messages.length === 0) return null;

    const dismiss = (index) =>
        setDismissal((current) => ({
            ...current,
            indexes: [...current.indexes, index],
        }));

    return (
        <Stack spacing={1} sx={{ mb: 2 }}>
            {messages.map((item) => (
                <Alert
                    key={item.index}
                    severity={getFlashSeverity(item.type)}
                    onClose={() => dismiss(item.index)}
                    sx={{ borderRadius: PLAYER_RADII.surface }}
                >
                    {item.message}
                </Alert>
            ))}
        </Stack>
    );
};

export default StageFlashMessages;
