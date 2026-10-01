/**
 * Instructor analytics index: pick a course to open its analytics.
 */

import { Head, Link } from "@inertiajs/react";
import {
    Alert,
    Button,
    Card,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

import InstructorLayout from "@/layouts/InstructorLayout";
import { formatCount } from "../components/analytics/format";

export default function AnalyticsIndex({ programs = [] }) {
    return (
        <InstructorLayout breadcrumbs={[{ label: "Analytics" }]}>
            <Head title="Analytics" />

            <Stack spacing={3}>
                <div>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{ fontWeight: 700 }}
                    >
                        Analytics
                    </Typography>
                    <Typography color="textSecondary">
                        Choose a course to see enrollments, learner status,
                        lesson engagement and assessment results.
                    </Typography>
                </div>

                {programs.length === 0 ? (
                    <Alert severity="info">
                        No courses assigned yet. Analytics appear here once you
                        are assigned to a course.
                    </Alert>
                ) : (
                    <Card>
                        <TableContainer>
                            <Table aria-label="Courses">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Course</TableCell>
                                        <TableCell align="right">
                                            Learners
                                        </TableCell>
                                        <TableCell align="right">
                                            Analytics
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {programs.map((program) => (
                                        <TableRow key={program.id} hover>
                                            <TableCell>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 600 }}
                                                    >
                                                        {program.title}
                                                    </Typography>
                                                    {!program.isPublished && (
                                                        <Chip
                                                            label="Draft"
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Stack>
                                                {program.code && (
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        {program.code}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCount(
                                                    program.learnerCount,
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    component={Link}
                                                    href={program.analyticsUrl}
                                                    size="small"
                                                    startIcon={
                                                        <InsightsOutlinedIcon />
                                                    }
                                                    aria-label={`View analytics for ${program.title}`}
                                                >
                                                    View analytics
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}
            </Stack>
        </InstructorLayout>
    );
}
