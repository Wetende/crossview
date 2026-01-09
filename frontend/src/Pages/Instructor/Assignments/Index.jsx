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
  IconButton,
} from '@mui/material';
import {
  IconPlus,
  IconArrowLeft,
  IconEdit,
  IconUsers,
  IconClock,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

export default function Index({ program, assignments }) {
  return (
    <>
      <Head title={`Assignments: ${program.name}`} />
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
              href={`/instructor/programs/${program.id}/`}
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">Assignments</Typography>
              <Typography color="text.secondary">{program.name}</Typography>
            </Box>
            <Button
              component={Link}
              href={`/instructor/programs/${program.id}/assignments/create/`}
              startIcon={<IconPlus />}
              variant="contained"
            >
              Create Assignment
            </Button>
          </Stack>

          {/* Assignments Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Weight</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Submissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No assignments yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{a.title}</Typography>
                      </TableCell>
                      <TableCell>{a.weight}%</TableCell>
                      <TableCell>
                        {a.dueDate ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconClock size={14} />
                            <span>{new Date(a.dueDate).toLocaleDateString()}</span>
                          </Stack>
                        ) : (
                          'No deadline'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={a.submissionType === 'file' ? 'File' : a.submissionType === 'text' ? 'Text' : 'Both'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {a.pendingCount > 0 && (
                          <Chip
                            label={`${a.pendingCount} to grade`}
                            color="warning"
                            size="small"
                          />
                        )}
                        {a.pendingCount === 0 && a.submissionCount > 0 && (
                          <Chip
                            label={`${a.submissionCount} graded`}
                            color="success"
                            size="small"
                          />
                        )}
                        {a.submissionCount === 0 && (
                          <Typography variant="caption" color="text.secondary">
                            None yet
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={a.isPublished ? 'Published' : 'Draft'}
                          color={a.isPublished ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            component={Link}
                            href={`/instructor/assignments/${a.id}/edit/`}
                            size="small"
                            startIcon={<IconEdit size={16} />}
                          >
                            Edit
                          </Button>
                          <Button
                            component={Link}
                            href={`/instructor/assignments/${a.id}/submissions/`}
                            size="small"
                            startIcon={<IconUsers size={16} />}
                          >
                            View
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Container>
    </>
  );
}
