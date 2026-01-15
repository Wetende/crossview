/**
 * Assessment Results Page
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { Head, router } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function StatusChip({ status }) {
  const colorMap = {
    Pass: 'success',
    Fail: 'error',
    Competent: 'success',
    'Not Yet Competent': 'warning',
  };

  return (
    <Chip
      label={status || 'Pending'}
      color={colorMap[status] || 'default'}
      size="small"
    />
  );
}

function ComponentScores({ components }) {
  if (!components || Object.keys(components).length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Component Scores
      </Typography>
      <Stack spacing={1}>
        {Object.entries(components).map(([name, score]) => (
          <Box key={name}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{name}</Typography>
              <Typography variant="body2" fontWeight="medium">
                {typeof score === 'number' ? score.toFixed(1) : score}
              </Typography>
            </Box>
            {typeof score === 'number' && (
              <LinearProgress
                variant="determinate"
                value={Math.min(score, 100)}
                sx={{ height: 6, borderRadius: 1 }}
              />
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function ResultCard({ result }) {
  return (
    <motion.div {...fadeIn}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" component="h3">
                {result.nodeTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.programName} • {result.nodeType}
              </Typography>
            </Box>
            <StatusChip status={result.status} />
          </Box>

          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            {result.total !== null && result.total !== undefined && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Score
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {typeof result.total === 'number' ? result.total.toFixed(1) : result.total}%
                </Typography>
              </Box>
            )}
            {result.letterGrade && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Grade
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {result.letterGrade}
                </Typography>
              </Box>
            )}
          </Box>

          <ComponentScores components={result.components} />

          {result.lecturerComments && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Lecturer Comments
              </Typography>
              <Typography variant="body2">{result.lecturerComments}</Typography>
            </Box>
          )}

          {result.publishedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Published: {new Date(result.publishedAt).toLocaleDateString()}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Assessments({
  results,
  pagination,
  filters,
  programOptions,
  statusOptions,
}) {
  const handleFilterChange = (key, value) => {
    router.visit('/student/assessments/', {
      data: {
        ...filters,
        [key]: value,
        page: 1, // Reset to first page on filter change
      },
      only: ['results', 'pagination', 'filters'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (event, page) => {
    router.visit('/student/assessments/', {
      data: {
        ...filters,
        page,
      },
      only: ['results', 'pagination'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <DashboardLayout role="student">
      <Head title="Assessment Results" />

      <Stack spacing={3}>
        <motion.div {...fadeIn}>
          <Typography variant="h4" component="h1" gutterBottom>
            Assessment Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your grades and assessment outcomes
          </Typography>
        </motion.div>

        {/* Filters */}
        <motion.div {...fadeIn}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Program</InputLabel>
                  <Select
                    value={filters.program}
                    label="Program"
                    onChange={(e) => handleFilterChange('program', e.target.value)}
                  >
                    {programOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {results.length === 0 ? (
          <motion.div {...fadeIn}>
            <Alert severity="info">
              No assessment results found. Results will appear here once your assessments are graded and published.
            </Alert>
          </motion.div>
        ) : (
          <>
            {results.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Stack>
    </DashboardLayout>
  );
}
