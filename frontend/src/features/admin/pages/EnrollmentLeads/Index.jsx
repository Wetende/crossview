import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DashboardLayout from "@/layouts/DashboardLayout";
import DataTable from "@/components/DataTable";

const STATUS_COLORS = {
    awaiting_identity: "default",
    awaiting_payment: "warning",
    awaiting_approval: "info",
    enrolled: "success",
    expired: "default",
    cancelled: "error",
};

const EnrollmentLeadsIndex = ({
    leads = [],
    programs = [],
    statusChoices = [],
    filters = {},
    pagination = {},
}) => {
    const [search, setSearch] = useState(filters.search || "");
    const [program, setProgram] = useState(filters.program || "");
    const [status, setStatus] = useState(filters.status || "");

    const visit = (params) => {
        router.visit(`/admin/enrollment-leads/?${params.toString()}`, {
            only: ["leads", "pagination", "filters"],
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilter = () => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (program) params.set("program", program);
        if (status) params.set("status", status);
        visit(params);
    };

    const handlePageChange = (page) => {
        const params = new URLSearchParams(window.location.search);
        params.set("page", page);
        visit(params);
    };

    const columns = [
        {
            id: "name",
            label: "Learner",
            render: (row) => (
                <Box>
                    <Typography fontWeight={600}>{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.email} · {row.phone}
                    </Typography>
                </Box>
            ),
        },
        { id: "programName", label: "Course" },
        {
            id: "status",
            label: "Status",
            render: (row) => (
                <Chip
                    size="small"
                    label={row.statusLabel}
                    color={STATUS_COLORS[row.status] || "default"}
                />
            ),
        },
        {
            id: "createdAt",
            label: "Captured",
            render: (row) => new Date(row.createdAt).toLocaleString(),
        },
    ];

    const actions = [
        {
            label: "View learner",
            icon: <VisibilityIcon fontSize="small" />,
            disabled: (row) => !row.userId,
            onClick: (row) => router.visit(`/admin/users/${row.userId}/edit/`),
        },
        {
            label: "View order",
            icon: <ReceiptIcon fontSize="small" />,
            disabled: (row) => !row.orderId,
            onClick: (row) => router.visit(`/commerce/orders/${row.orderId}/page/`),
        },
    ];

    return (
        <DashboardLayout role="admin" breadcrumbs={[{ label: "Enrollment Leads" }]}>
            <Head title="Enrollment Leads" />
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>Enrollment Leads</Typography>
                    <Typography color="text.secondary">
                        Follow learners from captured details through identity, payment and enrollment.
                    </Typography>
                </Box>
                <Card>
                    <CardContent>
                        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-end">
                            <TextField
                                size="small"
                                label="Search learner"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => event.key === "Enter" && handleFilter()}
                                slotProps={{ input: { startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> } }}
                            />
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Course</InputLabel>
                                <Select value={program} label="Course" onChange={(event) => setProgram(event.target.value)}>
                                    <MenuItem value="">All courses</MenuItem>
                                    {programs.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 190 }}>
                                <InputLabel>Status</InputLabel>
                                <Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}>
                                    <MenuItem value="">All statuses</MenuItem>
                                    {statusChoices.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={handleFilter}>Filter</Button>
                        </Stack>
                    </CardContent>
                </Card>
                <DataTable
                    columns={columns}
                    rows={leads}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    actions={actions}
                    emptyMessage="No enrollment leads found"
                />
            </Stack>
        </DashboardLayout>
    );
};

export default EnrollmentLeadsIndex;
