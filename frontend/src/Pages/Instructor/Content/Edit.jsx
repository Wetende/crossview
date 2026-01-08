/**
 * Instructor Content Edit
 * Edit session content (title, description, learning objectives, resources)
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
  Divider,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ArticleIcon from '@mui/icons-material/Article';

import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function ContentEdit({ node, errors = {} }) {
  const { data, setData, post, processing } = useForm({
    title: node.title || '',
    description: node.description || '',
    content: node.content || '',
    objectives: node.objectives || '',
    resources: node.resources || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/instructor/content/${node.id}/edit/`);
  };

  const breadcrumbs = [
    { label: 'Course Content', href: '/instructor/content/' },
    { label: node.programName },
    { label: node.title },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title={`Edit: ${node.title}`} />

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
                href="/instructor/content/"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 1 }}
              >
                Back to Content
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ArticleIcon color="primary" sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" component="h1">
                    Edit Content
                  </Typography>
                  <Chip label={node.nodeType} size="small" variant="outlined" />
                </Box>
              </Box>
            </Box>

            {errors._form && (
              <Alert severity="error">{errors._form}</Alert>
            )}

            {/* Main Content Card */}
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  <Typography variant="h6">Basic Information</Typography>
                  
                  <TextField
                    label="Title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    error={!!errors.title}
                    helperText={errors.title}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    error={!!errors.description}
                    helperText={errors.description || 'Brief overview of this session'}
                    multiline
                    rows={3}
                    fullWidth
                  />

                  <Divider />

                  <Typography variant="h6">Learning Content</Typography>

                  <TextField
                    label="Learning Objectives"
                    value={data.objectives}
                    onChange={(e) => setData('objectives', e.target.value)}
                    helperText="What students will learn (one per line)"
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="• Understand the concept of...
• Be able to apply...
• Demonstrate knowledge of..."
                  />

                  <TextField
                    label="Session Content"
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    helperText="Main content/notes for this session"
                    multiline
                    rows={8}
                    fullWidth
                  />

                  <TextField
                    label="Resources & References"
                    value={data.resources}
                    onChange={(e) => setData('resources', e.target.value)}
                    helperText="Books, links, and other materials (one per line)"
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="• Textbook Chapter 5
• https://example.com/resource
• Video: Introduction to..."
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                component={Link}
                href="/instructor/content/"
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </motion.div>
      </Box>
    </DashboardLayout>
  );
}
