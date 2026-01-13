import { Head, Link, router } from '@inertiajs/react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import {
    IconArrowLeft,
    IconArrowRight,
    IconCheck,
    IconLock,
    IconMessageCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import DiscussionPanel from '@/components/Discussions/DiscussionPanel';
import CoursePlayerLayout from '@/layouts/CoursePlayerLayout';
import CurriculumTreeSidebar from '@/components/Student/CurriculumTreeSidebar';
import BlockRenderer from '@/components/ContentBlocks/BlockRenderer';
import { motion } from 'framer-motion';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Session Viewer - View content and mark as complete
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export default function Session({
    node,
    enrollment,
    isCompleted,
    isLocked,
    lockReason,
    breadcrumbs = [],
    siblings = {},
    curriculumTree = [], // Added from backend
}) {
    const [showDiscussion, setShowDiscussion] = useState(false);

    const handleMarkComplete = () => {
        router.post(
            `/student/programs/${enrollment.id}/session/${node.id}/`,
            { mark_complete: true },
            { preserveScroll: true }
        );
    };

    // Build breadcrumbs for DashboardLayout
    const layoutBreadcrumbs = [
        { label: enrollment.programName, href: `/student/programs/${enrollment.id}/` },
        ...breadcrumbs.slice(0, -1).map((crumb) => ({
            label: crumb.title,
            href: crumb.url
        })),
        { label: node.title }
    ];

    if (isLocked) {
        return (
            <CoursePlayerLayout 
                programTitle={enrollment.programName}
                backLink={`/student/programs/${enrollment.id}/`}
            >
                <Head title={node.title} />
                 <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                    <LockedState
                        node={node}
                        enrollment={enrollment}
                        lockReason={lockReason}
                    />
                </Box>
            </CoursePlayerLayout>
        );
    }

    return (
        <CoursePlayerLayout 
            programTitle={enrollment.programName}
            backLink={`/student/programs/${enrollment.id}/`}
        >
            <Head title={node.title} />

            {/* Sidebar */}
            <CurriculumTreeSidebar 
                curriculumTree={curriculumTree} 
                activeNodeId={node.id}
                programName={enrollment.programName}
                progress={enrollment.progressPercent || 0}
            />

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, height: '100%', overflowY: 'auto', bgcolor: '#f5f5f5', p: { xs: 2, md: 4 }, position: 'relative' }}>
                <Box sx={{ maxWidth: 900, mx: 'auto', pb: 10 }}>
                    
                    {/* Content Card */}
                    <motion.div {...fadeInUp}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {node.nodeType}
                                        </Typography>
                                        <Typography variant="h4" fontWeight={700}>
                                            {node.title}
                                        </Typography>
                                    </Box>
                                    {isCompleted && (
                                        <Stack direction="row" spacing={1} alignItems="center" color="success.main">
                                            <IconCheck size={20} />
                                            <Typography variant="body2" fontWeight={600}>
                                                Completed
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                    <Button 
                                        startIcon={<IconMessageCircle />} 
                                        onClick={() => setShowDiscussion(true)}
                                        variant="outlined" 
                                        size="small"
                                    >
                                        Q&A / Discussion
                                    </Button>
                                </Box>

                                {node.description && (
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                        {node.description}
                                    </Typography>
                                )}

                                <Divider sx={{ my: 3 }} />

                                {/* Content Blocks */}
                                {node.blocks && node.blocks.length > 0 ? (
                                    <BlockRenderer blocks={node.blocks} />
                                ) : node.contentHtml ? (
                                    <Box
                                        sx={{
                                            '& img': { maxWidth: '100%', height: 'auto' },
                                            '& video': { maxWidth: '100%' },
                                            '& iframe': { maxWidth: '100%' },
                                            '& p': { mb: 2 },
                                            '& h1, & h2, & h3, & h4': { mt: 3, mb: 2 },
                                        }}
                                        dangerouslySetInnerHTML={{ __html: node.contentHtml }}
                                    />
                                ) : (
                                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No content available for this session.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Actions */}
                    <motion.div {...fadeInUp}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                {siblings.prev && (
                                    <Button
                                        component={Link}
                                        href={siblings.prev.url}
                                        startIcon={<IconArrowLeft size={18} />}
                                        variant="outlined"
                                    >
                                        Previous
                                    </Button>
                                )}
                            </Box>

                            {!isCompleted && (
                                <Button
                                    onClick={handleMarkComplete}
                                    variant="contained"
                                    color="primary"
                                    startIcon={<IconCheck size={18} />}
                                >
                                    Mark as Complete
                                </Button>
                            )}

                            <Box>
                                {siblings.next && (
                                    <Button
                                        component={Link}
                                        href={siblings.next.url}
                                        endIcon={<IconArrowRight size={18} />}
                                        variant="outlined"
                                    >
                                        Next
                                    </Button>
                                )}
                            </Box>
                        </Stack>
                    </motion.div>
                </Box>
            </Box>

            {showDiscussion && (
                <DiscussionPanel 
                    nodeId={node.id} 
                    onClose={() => setShowDiscussion(false)} 
                />
            )}
        </CoursePlayerLayout>
    );
}

function LockedState({ node, enrollment, lockReason }) {
    return (
        <motion.div {...fadeInUp}>
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <IconLock size={64} stroke={1.5} style={{ opacity: 0.5 }} />
                    <Typography variant="h5" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                        Content Locked
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {lockReason || 'Complete the prerequisites to unlock this content.'}
                    </Typography>
                    <Button
                        component={Link}
                        href={`/student/programs/${enrollment.id}/`}
                        variant="contained"
                    >
                        Back to Program
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
