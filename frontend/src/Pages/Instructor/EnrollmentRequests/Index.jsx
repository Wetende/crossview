import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Stack,
    Paper,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ToggleButtonGroup,
    ToggleButton,
} from "@mui/material";
import {
    IconArrowLeft,
    IconCheck,
    IconX,
    IconUserPlus,
    IconClock,
} from "@tabler/icons-react";
import { useState } from "react";
import { format } from "date-fns";

export default function EnrollmentRequests({ program, requests, filters }) {
    const [statusFilter, setStatusFilter] = useState(filters.status || "pending");
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectNotes, setRejectNotes] = useState("");

    const handleStatusChange = (_, newStatus) => {
        if (newStatus !== null) {
            setStatusFilter(newStatus);
            router.get(
                `/dashboard/instructor/programs/${program.id}/enrollment-requests/`,
                { status: newStatus },
                { preserveState: true, replace: true }
            );
        }
    };

    const handleApprove = (requestId) => {
        router.post(
            `/dashboard/instructor/programs/${program.id}/enrollment-requests/${requestId}/approve/`,
            {},
            { preserveScroll: true }
        );
    };

    const openRejectDialog = (request) => {
        setSelectedRequest(request);
        setRejectNotes("");
        setRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (selectedRequest) {
            router.post(
                `/dashboard/instructor/programs/${program.id}/enrollment-requests/${selectedRequest.id}/reject/`,
                { notes: rejectNotes },
                { preserveScroll: true }
            );
            setRejectDialogOpen(false);
            setSelectedRequest(null);
        }
    };

    const getStatusChip = (status) => {
        const config = {
            pending: { color: "warning", icon: <IconClock size={14} /> },
            approved: { color: "success", icon: <IconCheck size={14} /> },
            rejected: { color: "error", icon: <IconX size={14} /> },
        };
        const { color, icon } = config[status] || config.pending;
        return (
            <Chip
                icon={icon}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                size="small"
                color={color}
            />
        );
    };

    return (
        <>
            <Head title={`Enrollment Requests - ${program.name}`} />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Button
                        component={Link}
                        href={`/dashboard/instructor/programs/${program.id}/`}
                        startIcon={<IconArrowLeft size={18} />}
                        sx={{ mb: 2 }}
                    >
                        Back to Program
                    </Button>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                Enrollment Requests
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {program.name}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <IconUserPlus size={24} color="#666" />
                            <Typography variant="h5" fontWeight={600}>
                                {requests.pagination.totalCount}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                {/* Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <ToggleButtonGroup
                            value={statusFilter}
                            exclusive
                            onChange={handleStatusChange}
                            size="small"
                        >
                            <ToggleButton value="pending">Pending</ToggleButton>
                            <ToggleButton value="approved">Approved</ToggleButton>
                            <ToggleButton value="rejected">Rejected</ToggleButton>
                            <ToggleButton value="">All</ToggleButton>
                        </ToggleButtonGroup>
                    </CardContent>
                </Card>

                {/* Requests Table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student</TableCell>
                                <TableCell>Message</TableCell>
                                <TableCell>Requested</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.results.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            No enrollment requests found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.results.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {req.studentName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {req.studentEmail}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 300,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {req.message || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {format(new Date(req.createdAt), "MMM d, yyyy")}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{getStatusChip(req.status)}</TableCell>
                                        <TableCell align="right">
                                            {req.status === "pending" && (
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<IconCheck size={16} />}
                                                        onClick={() => handleApprove(req.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<IconX size={16} />}
                                                        onClick={() => openRejectDialog(req)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Stack>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {requests.pagination.totalPages > 1 && (
                    <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 1 }}>
                        <Button
                            disabled={!requests.pagination.hasPrev}
                            onClick={() =>
                                router.get(
                                    `/dashboard/instructor/programs/${program.id}/enrollment-requests/`,
                                    { page: requests.pagination.page - 1, status: statusFilter },
                                    { preserveState: true }
                                )
                            }
                        >
                            Previous
                        </Button>
                        <Typography sx={{ px: 2, py: 1 }}>
                            Page {requests.pagination.page} of {requests.pagination.totalPages}
                        </Typography>
                        <Button
                            disabled={!requests.pagination.hasNext}
                            onClick={() =>
                                router.get(
                                    `/dashboard/instructor/programs/${program.id}/enrollment-requests/`,
                                    { page: requests.pagination.page + 1, status: statusFilter },
                                    { preserveState: true }
                                )
                            }
                        >
                            Next
                        </Button>
                    </Box>
                )}
            </Container>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Enrollment Request</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Rejecting enrollment for{" "}
                        <strong>{selectedRequest?.studentName}</strong>
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for rejection (optional)"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="This will be visible to the student"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReject}
                        startIcon={<IconX size={16} />}
                    >
                        Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
