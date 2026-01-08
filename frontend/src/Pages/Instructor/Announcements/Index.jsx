/**
 * Instructor Announcements Index
 * Lists and manages announcements for instructor's programs
 */

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import NotificationsIcon from '@mui/icons-material/Notifications';

import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function AnnouncementsIndex({ programs = [], announcements = [] }) {
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const filteredAnnouncements = selectedProgram === 'all'
    ? announcements
    : announcements.filter(a => a.programId === parseInt(selectedProgram));

  const handleDelete = () => {
    if (deleteId) {
      router.delete(`/instructor/announcements/${deleteId}/`, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const breadcrumbs = [{ label: 'Announcements' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title="Announcements" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Announcements
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Post updates and messages to your students
              </Typography>
            </Box>

            <Button
              component={Link}
              href="/instructor/announcements/create/"
              variant="contained"
              startIcon={<AddIcon />}
            >
              New Announcement
            </Button>
          </Box>

          {/* Filter */}
          {programs.length > 1 && (
            <FormControl size="small" sx={{ maxWidth: 300 }}>
              <InputLabel>Filter by Program</InputLabel>
              <Select
                value={selectedProgram}
                label="Filter by Program"
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                <MenuItem value="all">All Programs</MenuItem>
                {programs.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {programs.length === 0 ? (
            <Alert severity="info">
              No programs assigned. Contact your administrator to be assigned to programs.
            </Alert>
          ) : filteredAnnouncements.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No announcements yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first announcement to communicate with students
                </Typography>
                <Button
                  component={Link}
                  href="/instructor/announcements/create/"
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Create Announcement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <List disablePadding>
                {filteredAnnouncements.map((announcement, index) => (
                  <ListItem
                    key={announcement.id}
                    divider={index < filteredAnnouncements.length - 1}
                    sx={{ py: 2 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {announcement.isPinned && (
                            <PushPinIcon fontSize="small" color="primary" />
                          )}
                          <Typography fontWeight={announcement.isPinned ? 'bold' : 'normal'}>
                            {announcement.title}
                          </Typography>
                          <Chip
                            label={announcement.programName}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {announcement.content.substring(0, 150)}
                            {announcement.content.length > 150 ? '...' : ''}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                            Posted {announcement.createdAt}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        component={Link}
                        href={`/instructor/announcements/${announcement.id}/edit/`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(announcement.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Card>
          )}
        </Stack>
      </motion.div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Announcement?</DialogTitle>
        <DialogContent>
          This action cannot be undone. Students will no longer see this announcement.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
