import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  IconEye,
  IconCheck,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  submitted: { color: 'info', label: 'Pending Review', icon: IconClock },
  approved: { color: 'success', label: 'Approved', icon: IconCheck },
  changes_requested: { color: 'warning', label: 'Changes Requested', icon: IconAlertTriangle },
};

export default function Index({ programs, filter }) {
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      router.visit(`/admin/course-approval/?status=${newFilter}`, { preserveState: true });
    }
  };

  return (
    <>
      <Head title="Course Approval Queue" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Typography variant="h4" gutterBottom>
            Course Approval Queue
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Review and approve instructor-submitted programs
          </Typography>

          {/* Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={handleFilterChange}
              size="small"
            >
              <ToggleButton value="submitted">Pending</ToggleButton>
              <ToggleButton value="approved">Approved</ToggleButton>
              <ToggleButton value="changes_requested">Changes Requested</ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          {/* Programs Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Program</TableCell>
                  <TableCell>Submitted By</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No programs in this queue
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  programs.map((p) => {
                    const statusConfig = STATUS_CONFIG[p.status] || STATUS_CONFIG.submitted;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight="medium">{p.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {p.submittedBy?.name || '—'}
                        </TableCell>
                        <TableCell>
                          {p.submittedAt
                            ? new Date(p.submittedAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<StatusIcon size={14} />}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            href={`/admin/course-approval/${p.id}/`}
                            startIcon={<IconEye size={16} />}
                            size="small"
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Container>
    </>
  );
}
