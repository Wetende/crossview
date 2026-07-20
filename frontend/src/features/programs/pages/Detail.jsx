/**
 * Instructor Program Detail Page
 */

import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    Button,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
} from "@mui/material";
import {
    IconArrowLeft,
    IconUsers,
    IconBook,
    IconClipboardCheck,
    IconFolder,
    IconUserCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

import InstructorLayout from "@/layouts/InstructorLayout";
import { htmlToPlainText } from "@/utils/htmlText";

export default function Detail({ program, learnerSummary, curriculum }) {
    const descriptionText = htmlToPlainText(program.description);
    const summary = learnerSummary || {
        total: 0,
        needsAttention: 0,
        completed: 0,
    };

    return (
        <InstructorLayout
            breadcrumbs={[
                { label: "My Programs", href: "/instructor/programs/" },
                { label: program.name },
            ]}
        >
            <Head title={program.name} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Stack spacing={3}>
                    {/* Header */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Button
                                component={Link}
                                href="/instructor/programs/"
                                startIcon={<IconArrowLeft />}
                                sx={{ mb: 1 }}
                            >
                                Back
                            </Button>
                            <Typography variant="h4" fontWeight="bold">
                                {program.name}
                            </Typography>
                            {program.code && (
                                <Typography color="text.secondary">
                                    Code: {program.code}
                                </Typography>
                            )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Button
                                component={Link}
                                href={`/instructor/programs/${program.id}/enrollment-requests/`}
                                variant="outlined"
                                startIcon={<IconUserCheck size={18} />}
                            >
                                Enrollment Requests
                            </Button>
                        </Stack>
                    </Box>

                    {/* Description */}
                    {descriptionText && (
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="body1">
                                {descriptionText}
                            </Typography>
                        </Paper>
                    )}

                    <Grid container spacing={3}>
                        {/* Quick Actions */}
                        <Grid xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Quick Actions
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Button
                                            component={Link}
                                            href={`/instructor/programs/${program.id}/students/`}
                                            fullWidth
                                            variant="contained"
                                            startIcon={<IconUsers size={18} />}
                                        >
                                            Manage learners
                                        </Button>
                                        <Button
                                            component={Link}
                                            href={`/instructor/programs/${program.id}/assignments/`}
                                            fullWidth
                                            variant="outlined"
                                            startIcon={
                                                <IconClipboardCheck size={18} />
                                            }
                                        >
                                            Manage Assignments
                                        </Button>
                                        <Button
                                            component={Link}
                                            href={`/instructor/gradebook/?program=${program.id}`}
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<IconBook size={18} />}
                                        >
                                            Gradebook
                                        </Button>
                                        <Button
                                            component={Link}
                                            href={`/instructor/programs/${program.id}/manage/`}
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<IconFolder size={18} />}
                                        >
                                            Course Content
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Course Resources */}
                            {program.resources &&
                                program.resources.length > 0 && (
                                    <Card sx={{ mt: 3 }}>
                                        <CardContent>
                                            <Typography
                                                variant="h6"
                                                gutterBottom
                                            >
                                                Resources
                                            </Typography>
                                            <List dense>
                                                {program.resources.map(
                                                    (res) => (
                                                        <ListItem key={res.id}>
                                                            <ListItemIcon>
                                                                <IconFolder
                                                                    size={18}
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <a
                                                                        href={
                                                                            res.url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            textDecoration:
                                                                                "none",
                                                                            color: "inherit",
                                                                        }}
                                                                    >
                                                                        {
                                                                            res.title
                                                                        }
                                                                    </a>
                                                                }
                                                                secondary={
                                                                    res.type
                                                                }
                                                            />
                                                        </ListItem>
                                                    ),
                                                )}
                                            </List>
                                        </CardContent>
                                    </Card>
                                )}
                        </Grid>

                        {/* Curriculum Preview */}
                        <Grid xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Curriculum ({curriculum.length} items)
                                    </Typography>
                                    {curriculum.length === 0 ? (
                                        <Alert severity="info">
                                            No curriculum content yet. Go to
                                            Course Content to add lessons.
                                        </Alert>
                                    ) : (
                                        <List dense>
                                            {curriculum
                                                .slice(0, 5)
                                                .map((node) => (
                                                    <ListItem key={node.id}>
                                                        <ListItemIcon>
                                                            <IconFolder
                                                                size={18}
                                                            />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={node.title}
                                                            secondary={
                                                                node.type
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            {curriculum.length > 5 && (
                                                <ListItem>
                                                    <ListItemText
                                                        primary={`...and ${curriculum.length - 5} more`}
                                                        sx={{
                                                            color: "text.secondary",
                                                            fontStyle: "italic",
                                                        }}
                                                    />
                                                </ListItem>
                                            )}
                                        </List>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Learner health */}
                        <Grid xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        <IconUsers
                                            size={20}
                                            style={{
                                                marginRight: 8,
                                                verticalAlign: "middle",
                                            }}
                                        />
                                        Learner health
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {[
                                            ["Total learners", summary.total],
                                            [
                                                "Needs attention",
                                                summary.needsAttention,
                                            ],
                                            ["Completed", summary.completed],
                                        ].map(([label, value]) => (
                                            <Grid xs={12} sm={4} key={label}>
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        p: 2,
                                                        height: "100%",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {label}
                                                    </Typography>
                                                    <Typography
                                                        variant="h4"
                                                        fontWeight={700}
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        {value}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Stack>
            </motion.div>
        </InstructorLayout>
    );
}
