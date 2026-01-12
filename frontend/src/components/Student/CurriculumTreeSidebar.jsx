import React, { useState } from 'react';
import {
    Box,
    Collapse,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Paper,
    LinearProgress
} from '@mui/material';
import {
    IconBook,
    IconCheck,
    IconChevronDown,
    IconChevronRight,
    IconLock,
} from '@tabler/icons-react';
import { Link } from '@inertiajs/react';

const CurriculumNode = ({ node, depth, activeNodeId }) => {
    // Expand if current node is a child (handled by logic or default open)
    // For now, default all open or check if activeNodeId path contains this node.
    // Simplifying to default open for active sections.
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isActive = node.id === activeNodeId;

    const getStatusIcon = () => {
        if (node.isLocked) return <IconLock size={16} color="gray" />;
        if (node.isCompleted) return <IconCheck size={16} color="green" />;
        return <IconBook size={16} />;
    };

    return (
        <>
            <ListItem
                disablePadding
                sx={{
                    pl: depth * 2,
                    display: 'block', // Ensure full width
                }}
            >
                {hasChildren ? (
                    <ListItemButton 
                        onClick={() => setExpanded(!expanded)}
                        sx={{ py: 1 }}
                    >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                            {expanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                        </ListItemIcon>
                        <ListItemText
                            primary={node.title}
                            primaryTypographyProps={{ 
                                variant: 'subtitle2', 
                                fontWeight: 600,
                                noWrap: true
                            }}
                        />
                    </ListItemButton>
                ) : (
                    <ListItemButton
                        component={Link}
                        href={node.url}
                        disabled={node.isLocked}
                        selected={isActive}
                        sx={{ 
                            py: 1,
                            borderLeft: isActive ? '3px solid #1976d2' : '3px solid transparent',
                            bgcolor: isActive ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 28, ml: 0.5 }}>
                            {getStatusIcon()}
                        </ListItemIcon>
                        <ListItemText
                            primary={node.title}
                            primaryTypographyProps={{ 
                                variant: 'body2', 
                                color: isActive ? 'primary' : 'text.primary',
                                fontWeight: isActive ? 500 : 400,
                                noWrap: true
                            }}
                        />
                    </ListItemButton>
                )}
            </ListItem>

            {hasChildren && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List disablePadding>
                        {node.children.map((child) => (
                            <CurriculumNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                activeNodeId={activeNodeId}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

const CurriculumTreeSidebar = ({ curriculumTree, activeNodeId, progress, programName }) => {
    return (
        <Paper 
            elevation={0} 
            sx={{ 
                width: 300, 
                borderRight: '1px solid #eee', 
                height: 'calc(100vh - 64px)', 
                overflowY: 'auto',
                bgcolor: '#fafafa',
                flexShrink: 0,
                position: 'sticky',
                top: 64
            }}
        >
            <Box sx={{ p: 2, borderBottom: '1px solid #eee', bgcolor: 'white' }}>
                 <Typography variant="subtitle1" fontWeight={700} noWrap title={programName}>
                    {programName}
                 </Typography>
                 <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" fontWeight={600}>{progress}%</Typography>
                 </Box>
            </Box>

            <List disablePadding>
                {curriculumTree.map((node) => (
                    <CurriculumNode
                        key={node.id}
                        node={node}
                        depth={0}
                        activeNodeId={activeNodeId}
                    />
                ))}
            </List>
        </Paper>
    );
};

export default CurriculumTreeSidebar;
