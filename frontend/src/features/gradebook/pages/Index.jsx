/**
 * Instructor Gradebook Index
 * Lists all programs with expandable statistics and student progress
 * Uses Inertia partial reload for loading students on expand
 */

import { useState, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';

import DashboardLayout from '@/layouts/DashboardLayout';
import { CourseRow, CourseSearch } from '../components';

export default function GradebookIndex({ 
  programs = [], 
  expandedStudents = null, 
  expandedProgramId = null 
}) {
  const [expandedCourseId, setExpandedCourseId] = useState(expandedProgramId);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const breadcrumbs = [{ label: 'Gradebook' }];

  // Filter courses by search term
  const filteredPrograms = useMemo(() => {
    if (!searchTerm.trim()) return programs;
    const term = searchTerm.toLowerCase();
    return programs.filter((p) =>
      p.name?.toLowerCase().includes(term)
    );
  }, [programs, searchTerm]);

  // Visible programs (with pagination)
  const visiblePrograms = useMemo(() => {
    return filteredPrograms.slice(0, visibleCount);
  }, [filteredPrograms, visibleCount]);

  // Toggle course expansion
  const handleToggle = useCallback((courseId) => {
    setExpandedCourseId((prev) => (prev === courseId ? null : courseId));
  }, []);

  // Load students for a course using Inertia partial reload
  const handleLoadStudents = useCallback((courseId) => {
    // Skip if already loaded for this program
    if (expandedProgramId === courseId && expandedStudents) return;

    setIsLoadingStudents(true);
    
    // Use Inertia partial reload - only fetch expandedStudents and expandedProgramId
    router.reload({
      data: { expand_program: courseId },
      only: ['expandedStudents', 'expandedProgramId'],
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsLoadingStudents(false),
    });
  }, [expandedProgramId, expandedStudents]);

  // Load more courses
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 10);
  }, []);

  const hasMore = visibleCount < filteredPrograms.length;

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title="Gradebook" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              p: 3,
            }}
          >
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                The Gradebook
              </Typography>
              <Divider
                sx={{
                  width: 40,
                  height: 3,
                  bgcolor: 'primary.main',
                  mt: 1,
                }}
              />
            </Box>

            <CourseSearch
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </Box>

          <Divider />

          {/* Course List */}
          {programs.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="info">
                No programs assigned. Contact your administrator to be assigned to programs.
              </Alert>
            </Box>
          ) : filteredPrograms.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="info">
                No courses match your search. Try a different keyword.
              </Alert>
            </Box>
          ) : (
            <>
              {visiblePrograms.map((program) => (
                <CourseRow
                  key={program.id}
                  course={{
                    id: program.id,
                    name: program.name,
                    thumbnailUrl: program.thumbnailUrl,
                    stats: {
                      totalStudents: program.studentCount || 0,
                      averageProgress: program.averageProgress || 0,
                      passedQuizzes: program.passedQuizzes || 0,
                      passedLessons: program.passedLessons || 0,
                      enrolledBySubscription: program.subscriptionEnrollments || 0,
                      passedAssignments: program.passedAssignments || 0,
                    },
                  }}
                  expanded={expandedCourseId === program.id}
                  onToggle={handleToggle}
                  students={expandedProgramId === program.id ? (expandedStudents || []) : []}
                  studentsLoaded={expandedProgramId === program.id && expandedStudents !== null}
                  studentsLoading={isLoadingStudents && expandedCourseId === program.id}
                  onLoadStudents={handleLoadStudents}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <Box sx={{ p: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleLoadMore}
                    sx={{
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      borderRadius: 20,
                      px: 4,
                    }}
                  >
                    Load More
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </motion.div>
    </DashboardLayout>
  );
}
