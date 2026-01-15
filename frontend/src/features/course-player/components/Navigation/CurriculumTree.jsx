import React, { useState, useEffect } from 'react';
import { List, Typography, Box } from '@mui/material';
import NodeItem from './NodeItem';

const CurriculumTree = ({ nodes, activeNodeId, enrollmentId }) => {
    // Initialize expanded state - auto-expand sections containing active node
    const [expandedSections, setExpandedSections] = useState(() => {
        const initial = {};
        // Auto-expand all sections by default for better UX
        const autoExpand = (nodeList) => {
            nodeList?.forEach(node => {
                if (node.children && node.children.length > 0) {
                    initial[node.id] = true;
                    autoExpand(node.children);
                }
            });
        };
        autoExpand(nodes);
        return initial;
    });

    const handleToggle = (nodeId) => {
        setExpandedSections(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }));
    };

    if (!nodes || nodes.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    No curriculum content available.
                </Typography>
            </Box>
        );
    }

    return (
        <List component="nav" disablePadding>
            {nodes.map((node) => (
                <NodeItem
                    key={node.id}
                    node={node}
                    isActive={node.id === activeNodeId}
                    isExpanded={expandedSections[node.id] ?? true}
                    onToggle={handleToggle}
                    activeNodeId={activeNodeId}
                    enrollmentId={enrollmentId}
                />
            ))}
        </List>
    );
};

export default CurriculumTree;
