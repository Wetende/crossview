import { useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from "@mui/material";
import { CheckCircle as CheckIcon } from "@mui/icons-material";
import DOMPurify from "dompurify";

import { CourseUnitCard } from "@/features/learning-experience/components";
import CourseOverviewRail from "./CourseOverviewRail";
import DeliveryOverviewCard from "./DeliveryOverviewCard";
import {
    buildAssessmentSummaries,
    buildUnitSummaries,
} from "./courseOverviewModel";

const DismissibleNotice = ({ notice, index }) => {
    const [visible, setVisible] = useState(true);
    if (!visible) return null;

    const title =
        typeof notice === "string"
            ? null
            : notice?.title || `Notice ${index + 1}`;
    const content =
        typeof notice === "string"
            ? notice
            : notice?.content || notice?.text || notice?.message || "";

    return (
        <Alert
            severity={notice?.type === "warning" ? "warning" : "info"}
            onClose={() => setVisible(false)}
            sx={{ borderRadius: 2 }}
        >
            {title && (
                <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{ mb: 0.5 }}
                >
                    {title}
                </Typography>
            )}
            <Box
                sx={{ "& p": { m: 0 } }}
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(content),
                }}
            />
        </Alert>
    );
};

const CourseOverview = ({
    program,
    enrollment,
    resumeUrl,
    curriculum = [],
}) => {
    const progress = Number(enrollment?.progressPercent || 0);
    const hasStarted = progress > 0;
    const units = buildUnitSummaries(curriculum);
    const assessments = buildAssessmentSummaries(curriculum);
    const hasWhatYouLearn =
        program?.whatYouLearnHtml || program?.whatYouLearnItems?.length > 0;

    return (
        <Box sx={{ maxWidth: 1180, mx: "auto" }}>
            <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
                <Typography
                    component="p"
                    variant="overline"
                    color="primary.main"
                >
                    Course overview
                </Typography>
                <Typography
                    component="h1"
                    variant="h4"
                    sx={{ mb: program?.description ? 1 : 0 }}
                >
                    {program?.name || "Course"}
                </Typography>
                {program?.description && (
                    <Box
                        sx={{
                            maxWidth: 760,
                            color: "text.secondary",
                            "& p": { mt: 0, mb: 0.75 },
                            "& p:last-of-type": { mb: 0 },
                        }}
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(program.description),
                        }}
                    />
                )}
            </Box>

            <DeliveryOverviewCard
                program={program}
                resumeUrl={resumeUrl}
                hasStarted={hasStarted}
                progressPercent={progress}
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        lg: "minmax(0, 1fr) 300px",
                    },
                    gap: { xs: 2.5, md: 3 },
                    alignItems: "start",
                }}
            >
                <Stack spacing={3} sx={{ minWidth: 0 }}>
                    <Box
                        component="section"
                        aria-labelledby="learning-units-title"
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            alignItems={{ sm: "baseline" }}
                            justifyContent="space-between"
                            spacing={0.5}
                            sx={{ mb: 1.5 }}
                        >
                            <Typography
                                id="learning-units-title"
                                component="h2"
                                variant="h5"
                            >
                                Learning units
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {units.length}{" "}
                                {units.length === 1 ? "unit" : "units"}
                            </Typography>
                        </Stack>

                        {units.length > 0 ? (
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, minmax(0, 1fr))",
                                    },
                                    gap: 2,
                                }}
                            >
                                {units.map((unit, index) => (
                                    <Box key={unit.id}>
                                        <CourseUnitCard
                                            unit={unit}
                                            index={index}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                                <CardContent>
                                    <Typography color="text.secondary">
                                        Course content will appear here when it
                                        is published.
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Box>

                    {(program?.notices || []).length > 0 && (
                        <Stack
                            component="section"
                            aria-label="Course notices"
                            spacing={1}
                        >
                            {program.notices.map((notice, index) => (
                                <DismissibleNotice
                                    key={notice?.id || notice?.title || index}
                                    notice={notice}
                                    index={index}
                                />
                            ))}
                        </Stack>
                    )}

                    {hasWhatYouLearn && (
                        <Card
                            component="section"
                            variant="outlined"
                            sx={{ borderRadius: 2.5 }}
                        >
                            <CardContent
                                sx={{
                                    p: { xs: 2, md: 2.5 },
                                    "&:last-child": { pb: { xs: 2, md: 2.5 } },
                                }}
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ mb: 1.5 }}
                                >
                                    <CheckIcon
                                        color="success"
                                        fontSize="small"
                                    />
                                    <Typography component="h2" variant="h6">
                                        What you&rsquo;ll learn
                                    </Typography>
                                </Stack>
                                {program.whatYouLearnHtml ? (
                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            "& ul, & ol": { pl: 3, mb: 1 },
                                            "& li": { mb: 0.5 },
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(
                                                program.whatYouLearnHtml,
                                            ),
                                        }}
                                    />
                                ) : (
                                    <List dense disablePadding>
                                        {program.whatYouLearnItems.map(
                                            (item, index) => (
                                                <ListItem
                                                    key={`${item}-${index}`}
                                                    disableGutters
                                                    sx={{ py: 0.25 }}
                                                >
                                                    <ListItemIcon
                                                        sx={{ minWidth: 30 }}
                                                    >
                                                        <CheckIcon
                                                            color="success"
                                                            fontSize="small"
                                                        />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={item}
                                                        primaryTypographyProps={{
                                                            variant: "body2",
                                                        }}
                                                    />
                                                </ListItem>
                                            ),
                                        )}
                                    </List>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Stack>

                <CourseOverviewRail
                    assessments={assessments}
                    deadlines={enrollment?.upcomingDeadlines || []}
                    resources={program?.resources || []}
                />
            </Box>
        </Box>
    );
};

export default CourseOverview;
