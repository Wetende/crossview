import { Head, Link, router, useForm } from '@inertiajs/react';
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
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  submitted: { color: 'warning', label: 'Pending', icon: IconClock },
  graded: { color: 'success', label: 'Graded', icon: IconCheck },
  returned: { color: 'info', label: 'Returned', icon: IconAlertTriangle },
};

export default function Submissions({ assignment, submissions, filter }) {
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      router.visit(
        `/instructor/assignments/${assignment.id}/submissions/?status=${newFilter}`,
        { preserveState: true }
      );
    }
  };

  return (
    <>
      <Head title={`Submissions: ${assignment.title}`} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Button
              component={Link}
              href={`/instructor/programs/${assignment.programId}/assignments/`}
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">Submissions</Typography>
              <Typography color="text.secondary">
                {assignment.title} • {assignment.programName}
              </Typography>
            </Box>
          </Stack>

          {/* Filter */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={handleFilterChange}
              size="small"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="submitted">Pending</ToggleButton>
              <ToggleButton value="graded">Graded</ToggleButton>
              <ToggleButton value="returned">Returned</ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          {/* Submissions Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Late</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No submissions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((s) => {
                    const statusConfig = STATUS_CONFIG[s.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>
                          <Box>
                            <Typography fontWeight="medium">{s.studentName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s.studentEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(s.submittedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {s.isLate ? (
                            <Chip
                              icon={<IconAlertTriangle size={14} />}
                              label="Late"
                              color="warning"
                              size="small"
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {s.hasFile && <Chip label="File" size="small" sx={{ mr: 0.5 }} />}
                          {s.hasText && <Chip label="Text" size="small" />}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<StatusIcon size={14} />}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {s.score !== null ? (
                            <Typography fontWeight="medium">
                              {s.finalScore?.toFixed(1)}%
                              {s.finalScore !== s.score && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {' '}(raw: {s.score}%)
                                </Typography>
                              )}
                            </Typography>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            href={`/instructor/submissions/${s.id}/grade/`}
                            size="small"
                            variant={s.status === 'submitted' ? 'contained' : 'outlined'}
                          >
                            {s.status === 'submitted' ? 'Grade' : 'View'}
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
