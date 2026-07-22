import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Check } from "@mui/icons-material";

const QuestionNavigator = ({
    count,
    currentIndex,
    answeredIndexes = [],
    onSelect,
}) => {
    const answered = new Set(answeredIndexes);

    return (
        <Box component="nav" aria-label="Quiz questions">
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 1 }}
            >
                <Typography variant="body2" fontWeight={800}>
                    Question {currentIndex + 1} of {count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {answered.size} answered
                </Typography>
            </Stack>
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                }}
            >
                {Array.from({ length: count }, (_, index) => {
                    const isCurrent = index === currentIndex;
                    const isAnswered = answered.has(index);
                    const label = `Question ${index + 1}${
                        isAnswered ? ", answered" : ", not answered"
                    }${isCurrent ? ", current" : ""}`;

                    return (
                        <ButtonBase
                            key={index}
                            type="button"
                            aria-label={label}
                            aria-current={isCurrent ? "step" : undefined}
                            onClick={() => onSelect(index)}
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: "2px solid",
                                borderColor: isCurrent
                                    ? "primary.main"
                                    : isAnswered
                                      ? "success.main"
                                      : "divider",
                                bgcolor: isCurrent
                                    ? "primary.main"
                                    : isAnswered
                                      ? "success.lighter"
                                      : "background.paper",
                                color: isCurrent
                                    ? "primary.contrastText"
                                    : isAnswered
                                      ? "success.dark"
                                      : "text.secondary",
                                fontWeight: 800,
                                transition:
                                    "background-color 180ms ease, border-color 180ms ease",
                                "&:hover": {
                                    bgcolor: isCurrent
                                        ? "primary.dark"
                                        : "action.hover",
                                },
                                "&.Mui-focusVisible": {
                                    outline: "3px solid",
                                    outlineColor: "primary.light",
                                    outlineOffset: 2,
                                },
                                "@media (prefers-reduced-motion: reduce)": {
                                    transition: "none",
                                },
                            }}
                        >
                            {isAnswered && !isCurrent ? (
                                <Check
                                    aria-hidden="true"
                                    sx={{ fontSize: 19 }}
                                />
                            ) : (
                                index + 1
                            )}
                        </ButtonBase>
                    );
                })}
            </Box>
        </Box>
    );
};

export default QuestionNavigator;
