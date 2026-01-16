/**
 * CourseStatisticsPanel Component
 * Displays aggregate course metrics in a 2x3 grid
 */

import { Box, Typography, Link } from '@mui/material';

const StatItem = ({ label, value, isPercentage = false }) => (
  <Box>
    <Typography component="span" variant="body2" color="text.secondary">
      {label}:{' '}
    </Typography>
    <Typography component="span" variant="body2" fontWeight="bold" color="primary.main">
      {isPercentage ? `${value}%` : value}
    </Typography>
  </Box>
);

export default function CourseStatisticsPanel({
  stats,
  onLoadStudents,
  studentsLoaded = false,
}) {
  const {
    totalStudents = 0,
    averageProgress = 0,
    passedQuizzes = 0,
    passedLessons = 0,
    enrolledBySubscription = 0,
    passedAssignments = 0,
  } = stats || {};

  return (
    <Box
      sx={{
        py: 2,
        px: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
      }}
    >
      {/* Statistics Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          mb: 2,
        }}
      >
        <StatItem label="All time course students" value={totalStudents} />
        <StatItem label="Course average progress" value={averageProgress} isPercentage />
        <StatItem label="Course passed quizzes" value={passedQuizzes} isPercentage />
        <StatItem label="Course passed lessons" value={passedLessons} isPercentage />
        <StatItem label="Course enrolled by subscription" value={enrolledBySubscription} />
        <StatItem label="Course passed assignments" value={passedAssignments} isPercentage />
      </Box>

      {/* Load Students Link */}
      {!studentsLoaded && (
        <Link
          component="button"
          variant="body2"
          onClick={onLoadStudents}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Load Students Statistics
        </Link>
      )}
    </Box>
  );
}
