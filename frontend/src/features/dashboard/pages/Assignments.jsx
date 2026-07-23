import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Typography,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Button
} from '@mui/material';
import DashboardLayout from '@/layouts/DashboardLayout';

export default function Assignments({ assignments = [] }) {
  return (
    <DashboardLayout role="student">
      <Head title="My Assignments" />

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" sx={{ mb: 4, justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              My Assignments
            </Typography>
            <Box sx={{ width: 40, height: 4, bgcolor: 'primary.main', borderRadius: 2 }} />
          </Box>
        </Stack>

        <Box>
        {assignments.length > 0 ? (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Assignment</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Score</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        {assignment.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {assignment.programName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Due Date'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={assignment.submissionStatus.replace('_', ' ').toUpperCase()} 
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          borderRadius: 1,
                          bgcolor: assignment.submissionStatus === 'graded' ? '#dcfce7' : (assignment.submissionStatus === 'submitted' ? '#dbeafe' : '#f1f5f9'),
                          color: assignment.submissionStatus === 'graded' ? '#166534' : (assignment.submissionStatus === 'submitted' ? '#1e40af' : '#475569')
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {assignment.score !== null ? (
                        <Typography fontWeight={700} color={assignment.passed ? 'success.main' : 'error.main'}>
                          {assignment.score}%
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        component={Link} 
                        href={`/student/assignment/${assignment.id}/`} 
                        size="small" 
                        variant="contained"
                        sx={{ 
                          bgcolor: '#f1f5f9', 
                          color: 'text.primary', 
                          boxShadow: 'none',
                          fontWeight: 500,
                          textTransform: 'none',
                          '&:hover': { bgcolor: '#e2e8f0', boxShadow: 'none' } 
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography color="text.secondary">No assignments available.</Typography>
          </Paper>
        )}
      </Box>
      </Box>
    </DashboardLayout>
  );
}
