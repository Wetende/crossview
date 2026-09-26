/**
 * Admin Announcements Index
 * Lists all announcements across all programs
 */

import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  IconPlus,
  IconTrash,
  IconPin,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

import DashboardLayout from '@/layouts/DashboardLayout';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function Index({ announcements = [], programs = [] }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const breadcrumbs = [{ label: 'Announcements' }];

  const handleDelete = (announcementId) => {
    setPendingDelete(announcementId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleting) return;
    setDeleteDialogOpen(false);
    setPendingDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    setDeleting(true);
    router.delete(
      `/admin/announcements/${pendingDelete}/delete/`,
      {
        onFinish: () => {
          setDeleting(false);
          setDeleteDialogOpen(false);
          setPendingDelete(null);
        },
      }
    );
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="admin">
      <Head title="Announcements" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                Announcements
              </Typography>
              <Divider sx={{ width: 40, borderBottomWidth: 3, borderColor: 'primary.main', mt: 1 }} />
            </Box>
            <Button
              component={Link}
              href="/admin/announcements/create/"
              variant="contained"
              startIcon={<IconPlus size={18} />}
              sx={{ textTransform: 'none' }}
            >
              Create Announcement
            </Button>
          </Box>

          <Divider />

          {/* Announcements List */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {announcements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="textSecondary">
                        No announcements yet
                      </Typography>
                      <Button
                        component={Link}
                        href="/admin/announcements/create/"
                        variant="outlined"
                        sx={{ mt: 2 }}
                      >
                        Create your first announcement
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Chip label={a.programName} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          {a.isPinned && (
                            <Tooltip title="Pinned">
                              <IconPin size={14} color="#f59e0b" />
                            </Tooltip>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {a.title}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            maxWidth: 300,
                            maxHeight: 48,
                            overflow: 'hidden',
                            '& p': { m: 0 },
                            '& ul, & ol': { m: 0, pl: 2.5 },
                            '& li': { mb: 0.25 },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(a.message || ''),
                          }}
                        />
                        {!a.message && (
                          <Typography color="textSecondary" variant="body2">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {a.authorName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography color="textSecondary" variant="body2">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(a.id)}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        message="Delete this announcement?"
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
      />
    </DashboardLayout>
  );
}
