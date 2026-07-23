import React from 'react';
import { Head } from '@inertiajs/react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  Button
} from '@mui/material';
import DashboardLayout from '@/layouts/DashboardLayout';

export default function Quizzes({ quizzes = [] }) {
  return (
    <DashboardLayout role="student">
      <Head title="My Quizzes" />

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Enrolled Quizzes
            </Typography>
          </Box>
          <Box>
            {/* Search Bar Placeholder */}
            <Paper 
              component="form" 
              sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 250, border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 1 }}
            >
              <Box component="input" placeholder="Search course or quiz" sx={{ ml: 1, flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem' }} />
              <Button type="button" sx={{ p: '10px', minWidth: 'auto', color: 'text.secondary' }}>
                <Typography sx={{ transform: 'rotate(-45deg)', fontSize: '1.2rem' }}>⚲</Typography>
              </Button>
            </Paper>
          </Box>
        </Stack>

        <Box>
          {quizzes.length > 0 ? (
            <Stack spacing={4}>
              {quizzes.map((quiz) => (
                <Box key={quiz.id}>
                  {/* Header: Course Name Box */}
                  <Box sx={{ bgcolor: '#e2e8f0', py: 1, px: 1.5, borderRadius: 1.5, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                      Course:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                      {quiz.programName}
                    </Typography>
                  </Box>

                  {/* Body: Quiz Details Row */}
                  <Box sx={{ py: 1, px: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box>
                      <Stack direction="row" spacing={1.5} sx={{ mb: 0.5, alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={500} color="text.primary">
                          {quiz.title}
                        </Typography>
                        <Chip 
                          label={quiz.passed ? "PASSED" : "FAILED"} 
                          color={quiz.passed ? "success" : "error"} 
                          size="small" 
                          sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.65rem' }}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {quiz.attempts} attempt(s) • {quiz.questionCount} questions
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={4} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {quiz.bestScore !== null ? `${quiz.bestScore}%` : '0%'}
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ 
                          bgcolor: '#e2e8f0', 
                          color: 'text.primary', 
                          boxShadow: 'none',
                          fontWeight: 500,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#cbd5e1', boxShadow: 'none' } 
                        }}
                      >
                        Details
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography color="text.secondary">You haven't attempted any quizzes yet.</Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}
