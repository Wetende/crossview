import { Head, Link, router } from '@inertiajs/react';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    Stack,
    Typography,
    Chip,
} from '@mui/material';
import { IconSchool } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

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
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        My Programs
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View and continue your enrolled programs
                    </Typography>
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
                        <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
                            <motion.div
                                {...fadeInUp}
                                transition={{ ...fadeInUp.transition, delay: index * 0.1 }}
                            >
                                <ProgramCard enrollment={enrollment} />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}
        </DashboardLayout>
    );
}

function ProgramCard({ enrollment }) {
    const statusColors = {
        active: 'primary',
        completed: 'success',
        withdrawn: 'default',
    };

    return (
        <Card
            component={Link}
            href={`/student/programs/${enrollment.id}/`}
            sx={{
                height: '100%',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                },
            }}
        >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <IconSchool size={32} />
                    <Chip
                        label={enrollment.status}
                        color={statusColors[enrollment.status] || 'default'}
                        size="small"
                    />
                </Stack>

                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                    {enrollment.programName}
                </Typography>

                {enrollment.programCode && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {enrollment.programCode}
                    </Typography>
                )}

                {enrollment.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {enrollment.description}
                    </Typography>
                )}

                <Box sx={{ mt: 'auto' }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Progress
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {enrollment.progressPercent}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={enrollment.progressPercent}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

function EmptyState({ hasFilter }) {
    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <IconSchool size={64} stroke={1.5} style={{ opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                {hasFilter ? 'No Programs Found' : 'No Enrollments Yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {hasFilter
                    ? 'Try changing the filter to see more programs.'
                    : 'You haven\'t enrolled in any programs yet.'}
            </Typography>
        </Box>
    );
}
