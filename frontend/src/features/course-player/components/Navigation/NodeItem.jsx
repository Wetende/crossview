import React from 'react';
import { ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, List, Box, Typography } from '@mui/material';
import { 
    PlayCircle as VideoIcon, 
    Description as TextIcon, 
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
    KeyboardArrowUp,
    KeyboardArrowDown,
    CheckCircle as CheckIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { Link } from '@inertiajs/react';

const NodeItem = ({ node, depth = 0, isActive, onToggle, isExpanded, activeNodeId, enrollmentId }) => {
    const isSection = node.nodeType === 'section' || (node.children && node.children.length > 0);
    const hasChildren = node.children && node.children.length > 0;
    
    // Count completed children for section label
    const getChildCount = () => {
        if (!hasChildren) return null;
        const completed = node.children.filter(c => c.isCompleted).length;
        return `${completed}/${node.children.length}`;
    };

    // Determine lesson type icon - colored icons like reference
    const getIcon = () => {
        if (node.isLocked) return <LockIcon sx={{ color: 'text.disabled', fontSize: 20 }} />;
        
        const lessonType = node.properties?.lesson_type || node.lessonType || node.nodeType;
        switch (lessonType) {
            case 'video':
            case 'video_lesson':
                return <VideoIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
            case 'quiz':
                return <QuizIcon sx={{ color: 'secondary.main', fontSize: 20 }} />;
            case 'assignment':
                return <AssignmentIcon sx={{ color: 'info.main', fontSize: 20 }} />;
            default:
                return <TextIcon sx={{ color: 'success.main', fontSize: 20 }} />;
        }
    };

    // Get duration label
    const getDuration = () => {
        const duration = node.properties?.duration || node.duration;
        if (!duration) return null;
        return `${duration} min`;
    };

    // Build navigation URL
    const getHref = () => {
        if (node.url) return node.url;
        return `/student/programs/${enrollmentId}/session/${node.id}/`;
    };

    // Active state
    const isNodeActive = isActive || node.id === activeNodeId;
    
    // Section styling - gray background
    if (isSection) {
        return (
            <>
                <ListItem disablePadding>
                    <ListItemButton 
                        onClick={() => onToggle(node.id)}
                        sx={{ 
                            bgcolor: 'grey.100',
                            py: 1.5,
                            px: 2,
                            '&:hover': { bgcolor: 'grey.200' }
                        }}
                    >
                        <ListItemText 
                            primary={node.title} 
                            primaryTypographyProps={{ 
                                variant: 'subtitle2', 
                                fontWeight: 600,
                                color: 'text.primary'
                            }}
                        />
                        
                        {/* Count + Chevron */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {getChildCount()}
                            </Typography>
                            {isExpanded ? 
                                <KeyboardArrowUp sx={{ color: 'text.secondary' }} /> : 
                                <KeyboardArrowDown sx={{ color: 'text.secondary' }} />
                            }
                        </Box>
                    </ListItemButton>
                </ListItem>

                {/* Children */}
                {hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {node.children.map((child) => (
                                <NodeItem 
                                    key={child.id} 
                                    node={child} 
                                    depth={depth + 1}
                                    activeNodeId={activeNodeId}
                                    isActive={child.id === activeNodeId}
                                    isExpanded={true}
                                    onToggle={onToggle}
                                    enrollmentId={enrollmentId}
                                />
                            ))}
                        </List>
                    </Collapse>
                )}
            </>
        );
    }

    // Lesson item styling
    return (
        <ListItem disablePadding>
            <ListItemButton 
                component={Link}
                href={!node.isLocked ? getHref() : undefined}
                disabled={node.isLocked}
                sx={{ 
                    py: 1.5,
                    px: 2,
                    borderLeft: isNodeActive ? '4px solid' : '4px solid transparent',
                    borderColor: isNodeActive ? 'primary.main' : 'transparent',
                    bgcolor: isNodeActive ? 'primary.50' : 'background.paper',
                    '&:hover': { 
                        bgcolor: isNodeActive ? 'primary.50' : 'grey.50' 
                    },
                    opacity: node.isLocked ? 0.5 : 1,
                }}
            >
                {/* Left: Icon */}
                <ListItemIcon sx={{ minWidth: 36 }}>
                    {getIcon()}
                </ListItemIcon>

                {/* Center: Title + Duration stacked */}
                <ListItemText 
                    primary={node.title} 
                    secondary={getDuration()}
                    primaryTypographyProps={{ 
                        variant: 'body2',
                        fontWeight: isNodeActive ? 600 : 400,
                        color: isNodeActive ? 'primary.main' : 'text.primary',
                    }}
                    secondaryTypographyProps={{ 
                        variant: 'caption',
                        color: 'text.secondary'
                    }}
                />

                {/* Right: Checkmark */}
                {node.isCompleted && (
                    <CheckIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                )}
            </ListItemButton>
        </ListItem>
    );
};

export default NodeItem;
