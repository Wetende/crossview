import { useId } from "react";
import { Box, Button, Typography } from "@mui/material";
import {
    NavigateBefore,
    NavigateNext,
    CheckCircle,
    EmojiEventsOutlined,
} from "@mui/icons-material";

// Minimum footer height; the stage scroll box uses it as scroll padding so
// focused or scrolled-to content is not hidden behind the sticky footer.
export const SESSION_CONTROL_HEIGHT = 64;

/**
 * Sticky lesson footer: "Previous" on the left, one primary action on the right.
 *
 * - not completed + next lesson  -> "Complete & Next" (onComplete(nextNode))
 * - not completed + last lesson  -> "Mark complete"   (onComplete())
 * - completed + next lesson      -> "Next"            (onNavigate(nextNode))
 * - completed + last lesson      -> disabled "Completed", or "View course
 *                                    summary" (onViewSummary()) once the
 *                                    course itself is complete
 *
 * When completion is blocked (`canComplete === false`) the learner can still
 * move on with "Next"; on the last lesson the completion button stays
 * disabled. Either way the reason is shown as a visible caption.
 * `completionLabel` replaces the not-completed label (e.g. "Attendance pending").
 * `showCompletion={false}` (free preview) drops completion entirely: the
 * primary action is a plain "Next", disabled on the last preview lesson.
 */
const SessionControl = ({
    prevNode,
    nextNode,
    onNavigate,
    onComplete,
    isCompleted,
    canComplete = true,
    completionTooltip = "",
    completionLabel = null,
    onViewSummary = null,
    showCompletion = true, // false: read-only preview, navigation only
}) => {
    const reasonId = useId();
    const isBlocked = showCompletion && !isCompleted && canComplete === false;
    const blockedReason = isBlocked
        ? completionTooltip || completionLabel || ""
        : "";

    const primaryAction = (() => {
        if (!showCompletion) {
            return {
                label: "Next",
                onClick: nextNode ? () => onNavigate(nextNode) : undefined,
                disabled: !nextNode,
                endIcon: <NavigateNext />,
            };
        }

        if (isCompleted || (isBlocked && nextNode)) {
            return nextNode
                ? {
                      label: "Next",
                      onClick: () => onNavigate(nextNode),
                      endIcon: <NavigateNext />,
                  }
                : onViewSummary
                  ? {
                        label: "View course summary",
                        onClick: onViewSummary,
                        startIcon: <EmojiEventsOutlined />,
                    }
                  : {
                        label: "Completed",
                        disabled: true,
                        startIcon: <CheckCircle />,
                    };
        }

        if (isBlocked) {
            return {
                label: completionLabel || "Mark complete",
                disabled: true,
            };
        }

        return {
            label:
                completionLabel ||
                (nextNode ? "Complete & Next" : "Mark complete"),
            onClick: () => onComplete(nextNode || null),
            endIcon: nextNode ? <NavigateNext /> : null,
            startIcon: nextNode ? null : <CheckCircle />,
        };
    })();

    return (
        <Box
            sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 2,
                minHeight: SESSION_CONTROL_HEIGHT,
                boxSizing: "border-box",
                display: "flex",
                flexWrap: { xs: "wrap", sm: "nowrap" },
                gap: { xs: 1, sm: 2 },
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1.5,
                mt: 4,
                bgcolor: "background.paper",
                borderTop: "1px solid",
                borderColor: "divider",
            }}
        >
            {/* Previous Button */}
            <Button
                variant="text"
                disabled={!prevNode}
                onClick={prevNode ? () => onNavigate(prevNode) : undefined}
                startIcon={<NavigateBefore />}
                sx={{
                    order: { xs: 1, sm: 0 },
                    flex: { xs: 1, sm: "0 0 auto" },
                    minWidth: 0,
                    color: "text.secondary",
                    textTransform: "none",
                    justifyContent: { xs: "center", sm: "flex-start" },
                    "&:hover": { color: "text.primary" },
                }}
            >
                Previous
            </Button>

            {/* Why completion is unavailable (visible, not a tooltip) */}
            {blockedReason && (
                <Typography
                    id={reasonId}
                    variant="caption"
                    color="textSecondary"
                    sx={{
                        order: { xs: 0, sm: 1 },
                        flex: { xs: "1 1 100%", sm: "1 1 auto" },
                        minWidth: 0,
                        textAlign: { xs: "center", sm: "right" },
                    }}
                >
                    {blockedReason}
                </Typography>
            )}

            {/* Primary action */}
            <Button
                variant="contained"
                color="primary"
                disableElevation
                onClick={primaryAction.disabled ? undefined : primaryAction.onClick}
                disabled={Boolean(primaryAction.disabled)}
                startIcon={primaryAction.startIcon}
                endIcon={primaryAction.endIcon}
                aria-describedby={blockedReason ? reasonId : undefined}
                sx={{
                    order: 2,
                    flex: { xs: 1, sm: "0 0 auto" },
                    whiteSpace: "nowrap",
                    textTransform: "none",
                    fontWeight: 600,
                }}
            >
                {primaryAction.label}
            </Button>
        </Box>
    );
};

export default SessionControl;
