/**
 * Instructor Programs List Page
 * MasterStudy LMS inspired design with tabs for All/Published/Draft
 * Requirements: US-2.1, US-2.2
 */

import { Head, Link, router } from '@inertiajs/react';
import {
    Box,
    Grid,
    Typography,
    Stack,
    Button,
    Tabs,
    Tab,
    useTheme,
} from '@mui/material';
import { IconPlus, IconSchool } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';
import { ProgramManageCard } from '@/components/cards';
import { useState } from 'react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

export default function InstructorProgramsIndex({ programs = [], filters = {} }) {
    const theme = useTheme();
    const [tab, setTab] = useState(filters.status || 'all');

    const handleTabChange = (event, newValue) => {
        setTab(newValue);
        const params = newValue === 'all' ? '' : `?status=${newValue}`;
        router.visit(`/instructor/programs/${params}`, {
            only: ['programs', 'filters'],
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Filter programs based on tab
    const filteredPrograms = programs.filter((program) => {
        if (tab === 'all') return true;
        if (tab === 'published') return program.isPublished || program.is_published;
        if (tab === 'draft') return !(program.isPublished || program.is_published);
        return true;
    });

    return (
        <DashboardLayout role="instructor">
            <Head title="My Programs" />
            
            {/* Header */}
            <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Courses
                    </Typography>
                    <Box sx={{ width: 40, height: 4, bgcolor: 'primary.main', borderRadius: 2, mt: 1 }} />
                </Box>

                <Button
                    component={Link}
                    href="/instructor/programs/create/"
                    variant="outlined"
                    startIcon={<IconPlus size={18} />}
                    sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Add New course
                </Button>
            </Stack>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs 
                    value={tab} 
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            minWidth: 80,
                        },
                    }}
                >
                    <Tab label="All" value="all" />
                    <Tab label="Published" value="published" />
                    <Tab label="In draft" value="draft" />
                </Tabs>
            </Box>

            {/* Programs Grid */}
            {filteredPrograms.length === 0 ? (
                <EmptyState tab={tab} />
            ) : (
                <Grid container spacing={3}>
                    {filteredPrograms.map((program, index) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={program.id}>
                            <motion.div
                                {...fadeInUp}
                                transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
                            >
                                <ProgramManageCard program={program} />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}
        </DashboardLayout>
    );
}

function EmptyState({ tab }) {
    const messages = {
        all: {
            title: 'No Programs Yet',
            body: 'You haven\'t been assigned any programs yet.',
        },
        published: {
            title: 'No Published Programs',
            body: 'You don\'t have any published programs.',
        },
        draft: {
            title: 'No Draft Programs',
            body: 'You don\'t have any programs in draft.',
        },
    };

    const { title, body } = messages[tab] || messages.all;

    return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <IconSchool size={64} stroke={1.5} style={{ opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {body}
            </Typography>
        </Box>
    );
}
