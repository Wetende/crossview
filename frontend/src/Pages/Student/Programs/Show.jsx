import { Head, Link } from '@inertiajs/react';
import {
    Box,
    Breadcrumbs,
    Card,
    CardContent,
    Collapse,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
import {
    IconBook,
    IconCheck,
    IconChevronDown,
    IconChevronRight,
    IconLock,
    IconSchool,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Program View - Curriculum tree with progress
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
export default function ProgramShow({
    program,
    enrollment,
    curriculumTree = [],
    completions = [],
    hierarchyLabels = []
}) {
    return (
        <>
            <Head title={program.name} />
            <Box sx={{ p: 3 }}>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link href="/student/dashboard/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Dashboard
                    </Link>
                    <Link href="/student/programs/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Programs
                    </Link>
                    <Typography color="text.primary">{program.name}</Typography>
                </Breadcrumbs>

                {/* Program Header */}
                <motion.div {...fadeInUp}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                                <IconSchool size={48} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h4" fontWeight={700}>
                                        {program.name}
                                    </Typography>
                                    {program.code && (
                                        <Typography variant="body1" color="text.secondary">
                                            {program.code}
                                        </Typography>
                                    )}
                                    {program.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {program.description}
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>

                            {/* Progress Bar */}
                            <Box sx={{ mt: 3 }}>
                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Overall Progress
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {enrollment.progressPercent}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={enrollment.progressPercent}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Curriculum Tree */}
                <motion.div {...fadeInUp}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Curriculum
                    </Typography>
                    <Card>
                        <List disablePadding>
                            {curriculumTree.map((node, index) => (
                                <CurriculumNode
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    hierarchyLabels={hierarchyLabels}
                                    isLast={index === curriculumTree.length - 1}
                                />
                            ))}
                        </List>
                    </Card>
                </motion.div>
            </Box>
        </>
    );
}

function CurriculumNode({ node, depth, hierarchyLabels, isLast }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const label = hierarchyLabels[depth] || node.nodeType;

    const getStatusIcon = () => {
        if (node.isLocked) return <IconLock size={18} color="gray" />;
        if (node.isCompleted) return <IconCheck size={18} color="green" />;
        return <IconBook size={18} />;
    };

    return (
        <>
            <ListItem
                disablePadding
                divider={!isLast || hasChildren}
                sx={{
                    pl: depth * 3,
                    opacity: node.isLocked ? 0.6 : 1,
                }}
            >
                {hasChildren ? (
                    <ListItemButton onClick={() => setExpanded(!expanded)}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            {expanded ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                        </ListItemIcon>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            {getStatusIcon()}
                        </ListItemIcon>
                        <ListItemText
                            primary={node.title}
                            secondary={label}
                            primaryTypographyProps={{ fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                    </ListItemButton>
                ) : (
                    <ListItemButton
                        component={Link}
                        href={node.url}
                        disabled={node.isLocked}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box sx={{ width: 18 }} /> {/* Spacer */}
                        </ListItemIcon>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            {getStatusIcon()}
                        </ListItemIcon>
                        <ListItemText
                            primary={node.title}
                            secondary={label}
                            primaryTypographyProps={{ fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                    </ListItemButton>
                )}
            </ListItem>

            {hasChildren && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        {node.children.map((child, index) => (
                            <CurriculumNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                hierarchyLabels={hierarchyLabels}
                                isLast={index === node.children.length - 1}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
}
