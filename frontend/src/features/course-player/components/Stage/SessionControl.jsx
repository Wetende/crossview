import { Box, Button, Tooltip } from "@mui/material";
import { NavigateBefore, NavigateNext, CheckCircle } from "@mui/icons-material";

const SessionControl = ({
    prevNode,
    nextNode,
    onNavigate,
    onComplete,
    isCompleted,
    canComplete = true, // New prop to control if completion is allowed
    completionTooltip = "", // Tooltip explaining why completion is disabled
    completionLabel = "Mark Complete",
}) => {
    const completeButton = (
        <Button
            variant="text"
            onClick={onComplete}
            disabled={!canComplete && !isCompleted}
            startIcon={<CheckCircle />}
            sx={{
                color: isCompleted
                    ? "primary.main"
                    : canComplete
                      ? "text.secondary"
                      : "text.disabled",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { bgcolor: "transparent" },
            }}
        >
            {isCompleted ? "Completed" : completionLabel}
        </Button>
    );

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: { xs: "wrap", sm: "nowrap" },
                gap: { xs: 1, sm: 2 },
                justifyContent: "space-between",
                alignItems: "center",
                py: 2,
                mt: 4,
                borderTop: "1px solid",
                borderColor: "divider",
            }}
        >
            {/* Previous Button */}
            <Button
                disabled={!prevNode}
                onClick={prevNode ? () => onNavigate(prevNode) : undefined}
                startIcon={<NavigateBefore />}
                sx={{
                    order: { xs: 1, sm: 0 },
                    flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" },
                    minWidth: 0,
                    color: "text.secondary",
                    textTransform: "none",
                    justifyContent: "flex-start",
                    "&:hover": {
                        bgcolor: "transparent",
                        color: "text.primary",
                    },
                }}
            >
                Previous
            </Button>

            {/* Center: Completed Status */}
            <Box
                sx={{
                    order: { xs: 3, sm: 0 },
                    flex: { xs: "1 1 100%", sm: "0 0 auto" },
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                {completionTooltip && !canComplete && !isCompleted ? (
                    <Tooltip title={completionTooltip} arrow>
                        <span>{completeButton}</span>
                    </Tooltip>
                ) : (
                    completeButton
                )}
            </Box>

            {/* Next Button */}
            <Button
                disabled={!nextNode}
                onClick={nextNode ? () => onNavigate(nextNode) : undefined}
                endIcon={<NavigateNext />}
                sx={{
                    order: { xs: 2, sm: 0 },
                    flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" },
                    minWidth: 0,
                    color: "text.secondary",
                    textTransform: "none",
                    justifyContent: "flex-end",
                    "&:hover": {
                        bgcolor: "transparent",
                        color: "text.primary",
                    },
                }}
            >
                Next
            </Button>
        </Box>
    );
};

export default SessionControl;
