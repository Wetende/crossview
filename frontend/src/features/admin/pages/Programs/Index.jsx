/**
 * Admin Programs List Page
 * Requirements: FR-3.1, US-3.1
 */

import { Head, Link, router } from "@inertiajs/react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SettingsIcon from "@mui/icons-material/Settings";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import DeleteIcon from "@mui/icons-material/Delete";

import DashboardLayout from "@/layouts/DashboardLayout";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ProgramsIndex({
  programs = [],
  courseLevels = [],
  filters = {},
  pagination = {},
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [search, setSearch] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "");
  const [level, setLevel] = useState(filters.level || "");

  const allPrograms = programs;

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (level) params.set("level", level);

    router.visit(`/admin/programs/?${params.toString()}`, {
      only: ["programs", "pagination"],
      preserveState: true,
    });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page);
    router.visit(`/admin/programs/?${params.toString()}`, {
      only: ["programs", "pagination"],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedProgram) return;
    router.post(
      `/admin/programs/${selectedProgram.id}/delete/`,
      {},
      {
        onFinish: () => {
          setDeleteDialogOpen(false);
          setSelectedProgram(null);
        },
      },
    );
  };

  const columns = [
    {
      id: "name",
      label: "Name",
      render: (row) => (
        <Box>
          <Link
            href={`/admin/programs/${row.id}/`}
            style={{ textDecoration: "none" }}
          >
            <Typography fontWeight={500} color="primary" fontSize="0.875rem">
              {row.name}
            </Typography>
          </Link>
          {row.code && (
            <Typography variant="caption" color="text.secondary">
              {row.code}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: "level",
      label: "Level",
      render: (row) =>
        row.level ? (
          <Chip label={row.level} size="small" variant="outlined" />
        ) : (
          "—"
        ),
    },
    {
      id: "enrollmentCount",
      label: "Enrollments",
      render: (row) => (
        <Typography fontSize="0.875rem" fontWeight={500}>
          {row.enrollmentCount ?? 0}
        </Typography>
      ),
    },
    {
      id: "isPublished",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.isPublished ? "Published" : "Draft"}
          size="small"
          color={row.isPublished ? "success" : "default"}
          sx={{
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        />
      ),
    },
  ];

  const actions = [
    {
      label: "View Details",
      icon: <VisibilityIcon fontSize="small" />,
      onClick: (row) => router.visit(`/admin/programs/${row.id}/`),
    },
    {
      label: "Edit",
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => router.visit(`/admin/programs/${row.id}/edit/`),
    },
    {
      label: "Course Manager",
      icon: <SettingsIcon fontSize="small" />,
      onClick: (row) =>
        router.visit(`/instructor/programs/${row.id}/manage/`),
    },
    {
      label: (row) => (row.isPublished ? "Unpublish" : "Publish"),
      icon: (row) =>
        row.isPublished ? (
          <UnpublishedIcon fontSize="small" />
        ) : (
          <PublishIcon fontSize="small" />
        ),
      onClick: (row) =>
        router.post(`/admin/programs/${row.id}/publish/`),
    },
    {
      label: "Delete",
      icon: <DeleteIcon fontSize="small" />,
      onClick: (row) => {
        setSelectedProgram(row);
        setDeleteDialogOpen(true);
      },
      color: "error",
      disabled: (row) => row.enrollmentCount > 0,
    },
  ];

  return (
    <DashboardLayout role="admin" breadcrumbs={[{ label: "Programs" }]}>
      <Head title="Programs" />

      <Stack spacing={3}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Programs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage academic programs and courses
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/programs/create/"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create Program
          </Button>
        </Box>

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "flex-end" }}
            >
              <TextField
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                sx={{
                  minWidth: { xs: "100%", md: 200 },
                  maxWidth: { md: 300 },
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
                onKeyPress={(e) => e.key === "Enter" && handleFilter()}
              />
              <FormControl
                size="small"
                fullWidth
                sx={{
                  minWidth: { xs: "100%", md: 150 },
                  maxWidth: { md: 180 },
                }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
              <FormControl
                size="small"
                fullWidth
                sx={{
                  minWidth: { xs: "100%", md: 180 },
                  maxWidth: { md: 220 },
                }}
              >
                <InputLabel>Level</InputLabel>
                <Select
                  value={level}
                  label="Level"
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {courseLevels.map((lvl) => (
                    <MenuItem key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleFilter}
                fullWidth
                sx={{
                  minWidth: { xs: "100%", md: "auto" },
                  maxWidth: { md: 120 },
                }}
              >
                Filter
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Programs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DataTable
            columns={columns}
            rows={allPrograms}
            pagination={pagination}
            onPageChange={handlePageChange}
            actions={actions}
            emptyMessage="No programs found"
          />
        </motion.div>
      </Stack>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedProgram(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Program"
        message={
          selectedProgram
            ? `Are you sure you want to delete "${selectedProgram.name}"?`
            : "Are you sure you want to delete this program?"
        }
        confirmLabel="Delete"
        confirmColor="error"
      />
    </DashboardLayout>
  );
}
