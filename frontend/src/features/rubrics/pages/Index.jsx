/**
 * Rubrics List Page
 * Accessible by both Instructors and Admins
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GradingIcon from '@mui/icons-material/Grading';

import DashboardLayout from '@/layouts/DashboardLayout';
import DataTable from '@/components/DataTable';

export default function RubricsIndex({ 
  rubrics = [], 
  pagination = {}, 
  role = 'instructor',
  canCreate = true 
}) {
  const handlePageChange = (page) => {
    router.visit(`/rubrics/?page=${page}`, {
      only: ['rubrics', 'pagination'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleDelete = (rubric) => {
    if (confirm(`Are you sure you want to delete "${rubric.name}"? This cannot be undone.`)) {
      router.post(`/rubrics/${rubric.id}/delete/`);
    }
  };

  const columns = [
    {
      id: 'name',
      label: 'Name',
      render: (row) => (
        <Box>
          <Typography fontWeight="medium">{row.name}</Typography>
          {row.description && (
            <Typography variant="caption" color="text.secondary" sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {row.description}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'dimensionsCount',
      label: 'Dimensions',
      render: (row) => (
        <Chip 
          label={`${row.dimensionsCount} criteria`} 
          size="small" 
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      id: 'maxScore',
      label: 'Max Score',
      render: (row) => (
        <Typography variant="body2">{row.maxScore} pts</Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      render: (row) => (
        <Typography variant="body2" color="text.secondary">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </Typography>
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => router.visit(`/rubrics/${row.id}/edit/`),
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: handleDelete,
      color: 'error',
    },
  ];

  const breadcrumbs = role === 'admin' 
    ? [{ label: 'Academic' }, { label: 'Rubrics' }]
    : [{ label: 'Teaching' }, { label: 'Rubrics' }];

  return (
    <DashboardLayout role={role} breadcrumbs={breadcrumbs}>
      <Head title="Rubrics" />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Rubrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage grading rubrics for practicum submissions
            </Typography>
          </Box>
          {canCreate && (
            <Button
              component={Link}
              href="/rubrics/create/"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create Rubric
            </Button>
          )}
        </Box>

        {/* Empty State */}
        {rubrics.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <GradingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Rubrics Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first rubric to start grading practicum submissions.
              </Typography>
              {canCreate && (
                <Button
                  component={Link}
                  href="/rubrics/create/"
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Create Your First Rubric
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Rubrics Table */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <DataTable
              columns={columns}
              rows={rubrics}
              pagination={pagination}
              onPageChange={handlePageChange}
              actions={actions}
              emptyMessage="No rubrics found"
            />
          </motion.div>
        )}
      </Stack>
    </DashboardLayout>
  );
}
