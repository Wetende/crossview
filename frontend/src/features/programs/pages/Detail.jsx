/**
 * Instructor Program Detail Page
 */

import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
    IconSend,
    IconMessageCircle,
    IconFolder,
    IconUserCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

import InstructorLayout from "@/layouts/InstructorLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { htmlToPlainText } from "@/utils/htmlText";

const STATUS_COLORS = {
    active: "success",
    completed: "info",
    withdrawn: "error",
    suspended: "warning",
};

export default function Detail({ program, students, curriculum }) {
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const descriptionText = htmlToPlainText(program.description);

    const handleSubmitForReview = () => {
        setSubmitDialogOpen(true);
    };

    const handleCloseSubmitDialog = () => {
        setSubmitDialogOpen(false);
    };

    const handleConfirmSubmitForReview = () => {
        router.post(`/instructor/programs/${program.id}/submit/`, {}, {
            onFinish: () => setSubmitDialogOpen(false),
        });
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
                            <Button
                                component={Link}
                                href={`/instructor/programs/${program.id}/change-requests/`}
                                variant="outlined"
                                startIcon={<IconMessageCircle size={18} />}
                            >
                                Change Requests
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<IconSend size={18} />}
                                onClick={handleSubmitForReview}
                            >
                                Submit for Review
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
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Quick Actions
                                    </Typography>
                                    <Stack spacing={1}>
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
                        <Grid item xs={12} md={8}>
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

                        {/* Students */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ mb: 2 }}
                                    >
                                        <Typography variant="h6">
                                            <IconUsers
                                                size={20}
                                                style={{
                                                    marginRight: 8,
                                                    verticalAlign: "middle",
                                                }}
                                            />
                                            Enrolled Students ({students.length}
                                            )
                                        </Typography>
                                    </Stack>

                                    {students.length === 0 ? (
                                        <Alert severity="info">
                                            No students enrolled yet.
                                        </Alert>
                                    ) : (
                                        <TableContainer
                                            component={Paper}
                                            variant="outlined"
                                        >
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>
                                                            Name
                                                        </TableCell>
                                                        <TableCell>
                                                            Email
                                                        </TableCell>
                                                        <TableCell>
                                                            Status
                                                        </TableCell>
                                                        <TableCell>
                                                            Enrolled
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            Actions
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {students.map((student) => (
                                                        <TableRow
                                                            key={student.id}
                                                            hover
                                                        >
                                                            <TableCell>
                                                                {student.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                {student.email}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={
                                                                        student.status
                                                                    }
                                                                    size="small"
                                                                    color={
                                                                        STATUS_COLORS[
                                                                            student
                                                                                .status
                                                                        ] ||
                                                                        "default"
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {new Date(
                                                                    student.enrolledAt,
                                                                ).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Button
                                                                    component={Link}
                                                                    href={`/messages/new/?recipient_id=${student.userId || student.id}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                >
                                                                    Message
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Stack>
            </motion.div>
            <ConfirmDialog
                open={submitDialogOpen}
                onClose={handleCloseSubmitDialog}
                onConfirm={handleConfirmSubmitForReview}
                title="Submit for Review"
                message="Submit this program for admin review?"
                confirmLabel="Submit"
            />
        </InstructorLayout>
    );
}
