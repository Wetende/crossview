/**
 * Instructor Gradebook Index
 * Lists all programs with expandable statistics and student progress
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

export default function GradebookIndex({ programs = [] }) {
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedStudents, setLoadedStudents] = useState({}); // courseId -> students[]
  const [loadingStudents, setLoadingStudents] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

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

  // Load students for a course
  const handleLoadStudents = useCallback(async (courseId) => {
    // Skip if already loaded
    if (loadedStudents[courseId]) return;

    setLoadingStudents(courseId);
    
    // Fetch students via Inertia or API call
    // For now, we'll simulate with a partial reload
    try {
      const response = await fetch(`/api/instructor/programs/${courseId}/students/`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLoadedStudents((prev) => ({
          ...prev,
          [courseId]: data.students || [],
        }));
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      // Fallback: set empty array to show "loaded" state
      setLoadedStudents((prev) => ({
        ...prev,
        [courseId]: [],
      }));
    } finally {
      setLoadingStudents(null);
    }
  }, [loadedStudents]);

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
                  students={loadedStudents[program.id] || []}
                  studentsLoaded={!!loadedStudents[program.id]}
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
