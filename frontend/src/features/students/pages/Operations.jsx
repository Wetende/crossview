import { Head, Link } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import InstructorLayout from "@/layouts/InstructorLayout";

const label = (value) => String(value || "not started").replaceAll("_", " ");

export default function LearnerOperations({ program, learner }) {
    const breadcrumbs = [
        { label: "Dashboard", href: "/dashboard/" },
        { label: "My Programs", href: "/instructor/programs/" },
        { label: program.name, href: `/instructor/programs/${program.id}/` },
        {
            label: "Students",
            href: `/instructor/programs/${program.id}/students/`,
        },
        { label: learner.name },
    ];

    return (
        <InstructorLayout breadcrumbs={breadcrumbs}>
            <Head title={`${learner.name} - Learning operations`} />
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    gap={2}
                >
                    <div>
                        <Typography variant="h4" fontWeight={700}>
                            {learner.name}
                        </Typography>
                        <Typography color="text.secondary">
                            {learner.email}
                        </Typography>
                    </div>
                    <Button
                        component={Link}
                        href={`/instructor/programs/${program.id}/students/`}
                    >
                        Back to learners
                    </Button>
                </Stack>

                {learner.status !== "active" && (
                    <Alert severity="info">
                        Course access is currently {label(learner.status)}.
                    </Alert>
                )}

                <Grid container spacing={2}>
                    {[
                        ["Learner state", label(learner.learnerState)],
                        ["Progress", `${learner.progressPercent}%`],
                        [
                            "Completed lessons",
                            `${learner.completedNodes} of ${learner.totalNodes}`,
                        ],
                        [
                            "Last activity",
                            learner.lastActivity
                                ? new Date(
                                      learner.lastActivity,
                                  ).toLocaleString()
                                : "No activity",
                        ],
                        [
                            "Access expires",
                            learner.expiresAt
                                ? new Date(learner.expiresAt).toLocaleString()
                                : "No expiry",
                        ],
                        [
                            "Enrolled",
                            new Date(learner.enrolledAt).toLocaleString(),
                        ],
                    ].map(([title, value]) => (
                        <Grid item xs={12} sm={6} md={4} key={title}>
                            <Card sx={{ height: "100%" }}>
                                <CardContent>
                                    <Typography
                                        variant="overline"
                                        color="text.secondary"
                                    >
                                        {title}
                                    </Typography>
                                    <Typography variant="h6">
                                        {value}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Card>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography variant="h6">
                                Published grades
                            </Typography>
                            {Object.keys(learner.grades || {}).length ? (
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {Object.entries(learner.grades).map(
                                        ([name, value]) => (
                                            <Chip
                                                key={name}
                                                label={`${name}: ${String(value)}`}
                                            />
                                        ),
                                    )}
                                </Stack>
                            ) : (
                                <Typography color="text.secondary">
                                    No published grades yet.
                                </Typography>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </InstructorLayout>
    );
}
