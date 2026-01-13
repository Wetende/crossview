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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import { IconCheck, IconX, IconClock, IconAlertTriangle } from '@tabler/icons-react';

import InstructorLayout from '@/layouts/InstructorLayout';

export default function Gradebook({ program, gradingConfig, quizzes = [], assignments = [], students }) {
  const [grades, setGrades] = useState(() => {
    const initial = {};
    students.forEach((student) => {
      initial[student.enrollmentId] = student.grades || { components: {} };
    });
    return initial;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  const hasUnpublished = students.some((s) => !s.isPublished && s.overallScore != null);

  const breadcrumbs = [
    { label: 'Programs', href: '/instructor/programs/' },
    { label: program.name, href: `/instructor/programs/${program.id}/` },
    { label: 'Gradebook' },
  ];

  const renderScoreCell = (score, passed = null) => {
    if (score === null || score === undefined) {
      return <Typography variant="body2" color="text.secondary">—</Typography>;
    }
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography variant="body2">{score.toFixed(1)}%</Typography>
        {passed === true && <IconCheck size={14} color="green" />}
        {passed === false && <IconX size={14} color="red" />}
      </Stack>
    );
  };

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

          {hasChanges && (
            <Alert severity="warning">
              You have unsaved changes. Click Save to keep your work.
            </Alert>
          )}

          {/* Gradebook Table */}
          <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    Student
                  </TableCell>
                  {quizzes.map((q) => (
                    <TableCell key={`quiz-${q.id}`} align="center" sx={{ minWidth: 100 }}>
                      <Tooltip title={q.title}>
                        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                          {q.title.length > 15 ? q.title.slice(0, 15) + '…' : q.title}
                        </Typography>
                      </Tooltip>
                      <Chip label="Quiz" size="small" sx={{ fontSize: 10 }} />
                    </TableCell>
                  ))}
                  {assignments.map((a) => (
                    <TableCell key={`assign-${a.id}`} align="center" sx={{ minWidth: 100 }}>
                      <Tooltip title={`${a.title} (${a.weight}%)`}>
                        <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                          {a.title.length > 15 ? a.title.slice(0, 15) + '…' : a.title}
                        </Typography>
                      </Tooltip>
                      <Chip label={`${a.weight}%`} size="small" color="secondary" sx={{ fontSize: 10 }} />
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                    Overall
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={quizzes.length + assignments.length + 2} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No students enrolled</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.enrollmentId} hover>
                      <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {student.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.email}
                        </Typography>
                      </TableCell>
                      {(student.quizScores || []).map((qs) => (
                        <TableCell key={`q-${qs.quizId}`} align="center">
                          {renderScoreCell(qs.score, qs.passed)}
                        </TableCell>
                      ))}
                      {(student.assignmentScores || []).map((as) => (
                        <TableCell key={`a-${as.assignmentId}`} align="center">
                          <Stack alignItems="center" spacing={0.5}>
                            {as.status === 'not_submitted' ? (
                              <Chip label="No submission" size="small" variant="outlined" />
                            ) : (
                              <>
                                {renderScoreCell(as.score)}
                                {as.isLate && (
                                  <Chip
                                    icon={<IconAlertTriangle size={12} />}
                                    label="Late"
                                    size="small"
                                    color="warning"
                                  />
                                )}
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={
                            student.overallScore !== null
                              ? student.overallScore >= 70
                                ? 'success.main'
                                : 'error.main'
                              : 'text.secondary'
                          }
                        >
                          {student.overallScore !== null ? `${student.overallScore}%` : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </motion.div>
    </InstructorLayout>
  );
}
