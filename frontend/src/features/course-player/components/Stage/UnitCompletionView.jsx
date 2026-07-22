import { Link } from "@inertiajs/react";
import {
    ArrowForward,
    CheckCircle,
    RadioButtonUnchecked,
    Replay,
} from "@mui/icons-material";
import {
    Box,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

const UnitCompletionView = ({ unit }) => {
    const progress = Number(unit?.progressPercent || 0);
    const complete = Boolean(unit?.isComplete);

    return (
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
            <Paper
                variant="outlined"
                sx={{
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: 3,
                    textAlign: "center",
                    mb: 2.5,
                }}
            >
                <Box
                    sx={{
                        position: "relative",
                        display: "inline-flex",
                        mb: 2,
                    }}
                >
                    <CircularProgress
                        variant="determinate"
                        value={progress}
                        size={112}
                        thickness={5}
                        color={complete ? "success" : "primary"}
                        aria-label={`Unit progress: ${Math.round(progress)} percent`}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <Typography variant="h5" fontWeight={800}>
                            {unit.completedCount}/{unit.totalCount}
                        </Typography>
                    </Box>
                </Box>

                <Typography
                    component="p"
                    variant="overline"
                    color="primary.main"
                >
                    End of unit
                </Typography>
                <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
                    {complete ? "Unit complete" : "Keep going"}
                </Typography>
                <Typography
                    color="text.secondary"
                    sx={{ maxWidth: 560, mx: "auto" }}
                >
                    {complete
                        ? `You completed every activity in ${unit.title}. You can review the unit or continue learning.`
                        : `Complete the remaining activities in ${unit.title} before moving on.`}
                </Typography>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="center"
                    spacing={1}
                    sx={{ mt: 3 }}
                >
                    {unit.reviewUrl && (
                        <Button
                            component={Link}
                            href={unit.reviewUrl}
                            variant="outlined"
                            startIcon={<Replay />}
                        >
                            Review unit
                        </Button>
                    )}
                    {complete && unit.nextUnit?.url && (
                        <Button
                            component={Link}
                            href={unit.nextUnit.url}
                            variant="contained"
                            endIcon={<ArrowForward />}
                        >
                            Continue to {unit.nextUnit.title}
                        </Button>
                    )}
                </Stack>
            </Paper>

            <Paper
                component="section"
                variant="outlined"
                sx={{ p: 2.5, borderRadius: 2.5 }}
            >
                <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
                    {unit.title}
                </Typography>
                <List disablePadding>
                    {(unit.items || []).map((item) => (
                        <ListItem
                            key={item.id}
                            component={Link}
                            href={item.url}
                            disableGutters
                            sx={{
                                px: 1,
                                py: 1,
                                borderRadius: 1,
                                color: "text.primary",
                                textDecoration: "none",
                                "&:hover": { bgcolor: "action.hover" },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 34 }}>
                                {item.isCompleted ? (
                                    <CheckCircle
                                        color="success"
                                        fontSize="small"
                                    />
                                ) : (
                                    <RadioButtonUnchecked
                                        color="disabled"
                                        fontSize="small"
                                    />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.title}
                                secondary={
                                    item.isCompleted
                                        ? "Completed"
                                        : "Not completed"
                                }
                                primaryTypographyProps={{ fontWeight: 700 }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default UnitCompletionView;
