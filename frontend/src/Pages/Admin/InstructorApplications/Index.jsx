import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  Avatar,
} from '@mui/material';
import {
  IconCheck,
  IconClock,
  IconX,
  IconFileText,
  IconEye,
  IconExternalLink,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  draft: { color: 'default', label: 'Draft', icon: IconFileText },
  pending_review: { color: 'warning', label: 'Pending Review', icon: IconClock },
  approved: { color: 'success', label: 'Approved', icon: IconCheck },
  rejected: { color: 'error', label: 'Rejected', icon: IconX },
};

export default function Index({
  applications,
  filters,
  pagination,
  statusChoices,
}) {
  const handleStatusFilter = (event, newStatus) => {
    if (newStatus !== null) {
      router.visit(`/admin/instructor-applications/?status=${newStatus}`, {
        only: ['applications', 'pagination'],
        preserveState: true,
      });
    }
  };

  const handlePageChange = (event, page) => {
    router.visit(
      `/admin/instructor-applications/?status=${filters.status}&page=${page}`,
      {
        only: ['applications', 'pagination'],
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  return (
    <>
      <Head title="Instructor Applications" />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 3 }}
          >
            <Typography variant="h4">Instructor Applications</Typography>
          </Stack>

          {/* Status Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <ToggleButtonGroup
              value={filters.status}
              exclusive
              onChange={handleStatusFilter}
              size="small"
            >
              <ToggleButton value="pending_review">
                <IconClock size={18} style={{ marginRight: 8 }} />
                Pending Review
              </ToggleButton>
              <ToggleButton value="approved">
                <IconCheck size={18} style={{ marginRight: 8 }} />
                Approved
              </ToggleButton>
              <ToggleButton value="rejected">
                <IconX size={18} style={{ marginRight: 8 }} />
                Rejected
              </ToggleButton>
              <ToggleButton value="draft">
                <IconFileText size={18} style={{ marginRight: 8 }} />
                Draft
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          {/* Applications Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Resume</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No applications found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const statusConfig = STATUS_CONFIG[app.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={app.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {app.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {app.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {app.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{app.jobTitle || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            icon={<StatusIcon size={14} />}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {app.hasResume ? (
                            <Chip
                              icon={<IconFileText size={14} />}
                              label="Uploaded"
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Not uploaded
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(app.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              component={Link}
                              href={`/admin/instructor-applications/${app.id}/`}
                              size="small"
                              startIcon={<IconEye size={16} />}
                            >
                              Review
                            </Button>
                            {app.linkedinUrl && (
                              <Button
                                component="a"
                                href={app.linkedinUrl}
                                target="_blank"
                                rel="noopener"
                                size="small"
                                startIcon={<IconExternalLink size={16} />}
                              >
                                LinkedIn
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.total > pagination.perPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(pagination.total / pagination.perPage)}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </motion.div>
      </Container>
    </>
  );
}
