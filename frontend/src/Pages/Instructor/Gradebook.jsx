/**
 * Instructor Gradebook Page
 * Requirements: US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6
 */

import { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';

import InstructorLayout from '../../components/layouts/InstructorLayout';
import GradebookTable from '../../components/GradebookTable';

export default function Gradebook({ program, gradingConfig, students }) {
  const [grades, setGrades] = useState(() => {
    // Initialize grades from existing data
    const initial = {};
    students.forEach((student) => {
      initial[student.enrollmentId] = student.grades || { components: {} };
    });
    return initial;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Determine grading mode
  const gradingMode = gradingConfig?.mode || 'summative';

  const handleGradeChange = useCallback((enrollmentId, componentKey, value) => {
    setGrades((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        components: {
          ...(prev[enrollmentId]?.components || {}),
          [componentKey]: value,
        },
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    setSaving(true);
    router.post(
      `/instructor/programs/${program.id}/gradebook/save/`,
      { grades },
      {
        preserveScroll: true,
        onFinish: () => {
          setSaving(false);
          setHasChanges(false);
        },
      }
    );
  };

  const handlePublish = () => {
    if (!confirm('Publish all grades? Students will be able to see their results.')) {
      return;
    }
    setPublishing(true);
    router.post(
      `/instructor/programs/${program.id}/gradebook/publish/`,
      {},
      {
        preserveScroll: true,
        onFinish: () => setPublishing(false),
      }
    );
  };

  // Check if any grades are unpublished
  const hasUnpublished = students.some((s) => !s.isPublished && s.grades?.total);

  const breadcrumbs = [
    { label: 'Programs', href: '/instructor/programs/' },
    { label: program.name, href: `/instructor/programs/${program.id}/` },
    { label: 'Gradebook' },
  ];

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={`Gradebook - ${program.name}`} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Gradebook
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {program.name}
                </Typography>
                <Chip
                  label={gradingMode.toUpperCase()}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="contained"
                startIcon={<PublishIcon />}
                onClick={handlePublish}
                disabled={!hasUnpublished || publishing}
              >
                {publishing ? 'Publishing...' : 'Publish Grades'}
              </Button>
            </Stack>
          </Box>

          {/* Unsaved changes warning */}
          {hasChanges && (
            <Alert severity="warning">
              You have unsaved changes. Click Save to keep your work.
            </Alert>
          )}

          {/* Gradebook Table */}
          <GradebookTable
            students={students.map((s) => ({
              ...s,
              grades: grades[s.enrollmentId] || s.grades,
            }))}
            gradingConfig={gradingConfig}
            onGradeChange={handleGradeChange}
          />

          {/* Empty state */}
          {students.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No students enrolled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Students will appear here once they enroll in this program.
              </Typography>
            </Box>
          )}
        </Stack>
      </motion.div>
    </InstructorLayout>
  );
}
