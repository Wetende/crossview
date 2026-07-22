import { Link } from "@inertiajs/react";
import {
    AssignmentOutlined,
    DescriptionOutlined,
    EventOutlined,
    OpenInNew,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    Divider,
    Link as MuiLink,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

const dateLabel = (value) =>
    value
        ? new Date(value).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : null;

const assessmentColor = (status) => {
    if (status === "Passed") return "success";
    if (status === "Awaiting grading") return "info";
    if (status === "Needs another attempt") return "warning";
    return "default";
};

const RailSection = ({ icon, title, children }) => (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            {icon}
            <Typography component="h2" variant="subtitle1" fontWeight={800}>
                {title}
            </Typography>
        </Stack>
        {children}
    </Paper>
);

const CourseOverviewRail = ({
    assessments = [],
    deadlines = [],
    resources = [],
}) => (
    <Stack component="aside" aria-label="Course information" spacing={2}>
        {deadlines.length > 0 && (
            <RailSection
                icon={<EventOutlined color="warning" />}
                title="Coming up"
            >
                <Stack divider={<Divider flexItem />} spacing={1.5}>
                    {deadlines.slice(0, 3).map((deadline) => (
                        <Box key={`${deadline.type}-${deadline.id}`}>
                            <Typography variant="body2" fontWeight={700}>
                                {deadline.title}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {dateLabel(deadline.dueAt)}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            </RailSection>
        )}

        {assessments.length > 0 && (
            <RailSection
                icon={<AssignmentOutlined color="primary" />}
                title="Assessment status"
            >
                <Stack spacing={1.25}>
                    {assessments.slice(0, 5).map((assessment) => (
                        <Box
                            key={assessment.id}
                            sx={{
                                p: 1.25,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1.5,
                            }}
                        >
                            {assessment.url ? (
                                <MuiLink
                                    component={Link}
                                    href={assessment.url}
                                    underline="hover"
                                    fontWeight={700}
                                    variant="body2"
                                >
                                    {assessment.title}
                                </MuiLink>
                            ) : (
                                <Typography variant="body2" fontWeight={700}>
                                    {assessment.title}
                                </Typography>
                            )}
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={1}
                                sx={{ mt: 1 }}
                            >
                                <Chip
                                    label={assessment.status}
                                    size="small"
                                    color={assessmentColor(assessment.status)}
                                    variant={
                                        assessment.status === "Not submitted"
                                            ? "outlined"
                                            : "filled"
                                    }
                                    sx={{ fontWeight: 700 }}
                                />
                                {assessment.score !== null && (
                                    <Typography
                                        variant="body2"
                                        fontWeight={800}
                                    >
                                        {Math.round(assessment.score)}%
                                    </Typography>
                                )}
                            </Stack>
                            {assessment.attemptNumber && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: "block" }}
                                >
                                    {assessment.attemptNumber} completed{" "}
                                    {assessment.attemptNumber === 1
                                        ? "attempt"
                                        : "attempts"}
                                </Typography>
                            )}
                        </Box>
                    ))}
                </Stack>
            </RailSection>
        )}

        {resources.length > 0 && (
            <RailSection
                icon={<DescriptionOutlined color="info" />}
                title="Course resources"
            >
                <Stack spacing={0.75}>
                    {resources.map((resource) => (
                        <Button
                            key={resource.id}
                            component="a"
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="text"
                            endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                            sx={{ justifyContent: "space-between", px: 0.5 }}
                        >
                            {resource.title || `Resource ${resource.id}`}
                        </Button>
                    ))}
                </Stack>
            </RailSection>
        )}
    </Stack>
);

export default CourseOverviewRail;
