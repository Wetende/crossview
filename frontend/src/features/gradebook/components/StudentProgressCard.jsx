/**
 * StudentProgressCard Component
 * Displays individual student with colored progress bars
 */

import { Box, Typography, Avatar, Stack } from '@mui/material';

// Color logic: 100% = green, 0% = gray, 1-99% = orange
const getProgressColor = (value) => {
  if (value >= 100) return '#10b981'; // green
  if (value <= 0) return '#9ca3af';   // gray
  return '#f59e0b';                    // orange
};

const LabeledProgressBar = ({ label, value, max }) => {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = getProgressColor(percent);

  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: color,
        borderRadius: 1,
        px: 1.5,
        py: 0.75,
        minWidth: 120,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#fff',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {label}: {value}/{max}
      </Typography>
    </Box>
  );
};

const PercentProgressBar = ({ label, value }) => {
  const color = getProgressColor(value);

  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: color,
        borderRadius: 1,
        px: 1.5,
        py: 0.75,
        minWidth: 120,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#fff',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {label}: {value}%
      </Typography>
    </Box>
  );
};

export default function StudentProgressCard({ student }) {
  const {
    name,
    email,
    avatarUrl,
    startedAt,
    lessonsPassed = 0,
    lessonsTotal = 0,
    quizzesPassed = 0,
    quizzesTotal = 0,
    assignmentsPassed = 0,
    assignmentsTotal = 0,
    overallProgress = 0,
  } = student;

  // Format date
  const formattedDate = startedAt
    ? new Date(startedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not started';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Avatar */}
      <Avatar
        src={avatarUrl}
        alt={name}
        sx={{ width: 48, height: 48 }}
      >
        {name?.charAt(0)}
      </Avatar>

      {/* Name & Email */}
      <Box sx={{ minWidth: 200 }}>
        <Typography variant="body2" fontWeight="bold">
          {name}
        </Typography>
        <Typography
          variant="caption"
          component="a"
          href={`mailto:${email}`}
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {email}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          Started: {formattedDate}
        </Typography>
      </Box>

      {/* Progress Bars */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ flex: 1, flexWrap: 'wrap', gap: 1 }}
      >
        <LabeledProgressBar
          label="Lessons Passed"
          value={lessonsPassed}
          max={lessonsTotal}
        />
        <LabeledProgressBar
          label="Quizzes Passed"
          value={quizzesPassed}
          max={quizzesTotal}
        />
        <LabeledProgressBar
          label="Assignments Passed"
          value={assignmentsPassed}
          max={assignmentsTotal}
        />
        <PercentProgressBar
          label="Progress"
          value={overallProgress}
        />
      </Stack>
    </Box>
  );
}
