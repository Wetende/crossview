import { Head, Link, router } from '@inertiajs/react';
import {
    Box,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
    Button,
} from '@mui/material';
import { IconSchool } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { EnrolledCourseCard } from '@/components/cards';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Program List - All enrolled programs with filtering
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export default function ProgramList({
    enrollments = [],
    filters = {},
    statusOptions = []
}) {
    const handleFilterChange = (status) => {
        router.visit(`/student/programs/?status=${status}`, {
            only: ['enrollments', 'filters'],
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout role="student">
            <Head title="My Programs" />
            
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Enrolled Courses
                    </Typography>
                    <Box sx={{ width: 40, height: 4, bgcolor: 'primary.main', borderRadius: 2 }} />
                </Box>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={filters.status || ''}
                        label="Status"
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>

            {enrollments.length === 0 ? (
                <EmptyState hasFilter={!!filters.status} />
            ) : (
                <Grid container spacing={3}>
                    {enrollments.map((enrollment, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={enrollment.id}>
                            <motion.div
                                {...fadeInUp}
                                transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
                            >
                                <EnrolledCourseCard enrollment={enrollment} />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}
        </DashboardLayout>
    );
}

function EmptyState({ hasFilter }) {
    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <IconSchool size={64} stroke={1.5} style={{ opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                {hasFilter ? 'No Programs Found' : 'No Enrollments Yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {hasFilter
                    ? 'Try changing the filter to see more programs.'
                    : 'You haven\'t enrolled in any programs yet.'}
            </Typography>
            {!hasFilter && (
                <Button
                    component={Link}
                    href="/programs/"
                    variant="contained"
                >
                    Browse Courses
                </Button>
            )}
        </Box>
    );
}
