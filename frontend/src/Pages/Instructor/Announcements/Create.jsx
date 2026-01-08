/**
 * Instructor Announcement Create/Edit
 * Form for creating or editing announcements
 */

import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PushPinIcon from '@mui/icons-material/PushPin';

import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function AnnouncementCreate({ programs = [], errors = {} }) {
  const { data, setData, post, processing } = useForm({
    programId: programs[0]?.id || '',
    title: '',
    content: '',
    isPinned: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/instructor/announcements/create/');
  };

  const breadcrumbs = [
    { label: 'Announcements', href: '/instructor/announcements/' },
    { label: 'Create' },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title="Create Announcement" />

      <Box component="form" onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack spacing={3}>
            {/* Header */}
            <Box>
              <Button
                component={Link}
                href="/instructor/announcements/"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 1 }}
              >
                Back to Announcements
              </Button>
              <Typography variant="h4" component="h1">
                Create Announcement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Post an update to your students
              </Typography>
            </Box>

            {errors._form && (
              <Alert severity="error">{errors._form}</Alert>
            )}

            <Card>
              <CardContent>
                <Stack spacing={3}>
                  {/* Program Selection */}
                  <FormControl fullWidth error={!!errors.programId}>
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={data.programId}
                      label="Program"
                      onChange={(e) => setData('programId', e.target.value)}
                      required
                    >
                      {programs.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.programId && (
                      <Typography variant="caption" color="error">
                        {errors.programId}
                      </Typography>
                    )}
                  </FormControl>

                  {/* Title */}
                  <TextField
                    label="Title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                    fullWidth
                    required
                    placeholder="e.g., Important: Exam Schedule Update"
                  />

                  {/* Content */}
                  <TextField
                    label="Message"
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    error={!!errors.content}
                    helperText={errors.content || 'Write your announcement message'}
                    multiline
                    rows={6}
                    fullWidth
                    required
                    placeholder="Write your announcement here..."
                  />

                  {/* Pin Option */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={data.isPinned}
                        onChange={(e) => setData('isPinned', e.target.checked)}
                        icon={<PushPinIcon />}
                        checkedIcon={<PushPinIcon />}
                      />
                    }
                    label="Pin this announcement (stays at top)"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                component={Link}
                href="/instructor/announcements/"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={processing}
              >
                {processing ? 'Posting...' : 'Post Announcement'}
              </Button>
            </Box>
          </Stack>
        </motion.div>
      </Box>
    </DashboardLayout>
  );
}
