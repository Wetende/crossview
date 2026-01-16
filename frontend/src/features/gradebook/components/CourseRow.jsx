/**
 * CourseRow Component
 * Expandable accordion row for each course in the gradebook
 */

import { Box, Typography, Button, Collapse, Avatar } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { motion, AnimatePresence } from 'framer-motion';

import CourseStatisticsPanel from './CourseStatisticsPanel';
import StudentProgressCard from './StudentProgressCard';

export default function CourseRow({
  course,
  expanded,
  onToggle,
  students,
  studentsLoaded,
  onLoadStudents,
}) {
  const {
    id,
    name,
    thumbnailUrl,
    stats,
  } = course;

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      {/* Course Header Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
        }}
      >
        {/* Course Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            variant="rounded"
            src={thumbnailUrl}
            alt={name}
            sx={{ width: 56, height: 40, borderRadius: 1 }}
          >
            {name?.charAt(0)}
          </Avatar>
          <Typography variant="body1" fontWeight="medium">
            {name}
          </Typography>
        </Box>

        {/* Toggle Button */}
        <Button
          variant="outlined"
          size="small"
          onClick={() => onToggle(id)}
          endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          sx={{
            borderRadius: 20,
            textTransform: 'none',
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'transparent',
            },
          }}
        >
          {expanded ? 'Show less' : 'More info'}
        </Button>
      </Box>

      {/* Expandable Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Statistics Panel */}
          <CourseStatisticsPanel
            stats={stats}
            studentsLoaded={studentsLoaded}
            onLoadStudents={() => onLoadStudents(id)}
          />

          {/* Students List */}
          {studentsLoaded && students && students.length > 0 && (
            <Box sx={{ px: 3, pb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, fontWeight: 600 }}>
                Students Statistics
              </Typography>
              <AnimatePresence>
                {students.map((student) => (
                  <StudentProgressCard key={student.id} student={student} />
                ))}
              </AnimatePresence>
            </Box>
          )}
        </motion.div>
      </Collapse>
    </Box>
  );
}
