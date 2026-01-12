import React, { useState } from 'react';
import { 
    Box, Button, Typography, IconButton, Paper, 
    Menu, MenuItem, Divider 
} from '@mui/material';
import { 
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors 
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';

// Editors
import VideoBlockEditor from './Editors/VideoBlockEditor';
import RichTextBlockEditor from './Editors/RichTextBlockEditor';
import QuizBlockSelector from './Editors/QuizBlockSelector';
import AssignmentBlockSelector from './Editors/AssignmentBlockSelector';

const BlockItem = ({ id, block, index, onChange, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleChange = (newData) => {
        onChange(block.id, newData);
    };

    return (
        <Paper 
            ref={setNodeRef} 
            style={style}
            elevation={1} 
            sx={{ mb: 2, p: 2, position: 'relative' }}
        >
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    borderBottom: '1px solid #f0f0f0', 
                    pb: 1 
                }}
            >
                <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex' }}>
                    <DragIndicatorIcon color="action" />
                </div>
                <Typography variant="subtitle2" sx={{ ml: 1, textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.75rem' }}>
                    {block.type} Block
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton size="small" onClick={() => onDelete(block.id)} color="error">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box>
                {block.type === 'VIDEO' && (
                    <VideoBlockEditor data={block.metadata || {}} onChange={handleChange} />
                )}
                {block.type === 'RICHTEXT' && (
                    <RichTextBlockEditor data={block.metadata || {}} onChange={handleChange} />
                )}
                {block.type === 'QUIZ' && (
                    <QuizBlockSelector data={block.metadata || {}} onChange={handleChange} />
                )}
                {block.type === 'ASSIGNMENT' && (
                    <AssignmentBlockSelector data={block.metadata || {}} onChange={handleChange} />
                )}
            </Box>
        </Paper>
    );
};

const BlockManager = ({ blocks, onBlocksChange }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = blocks.findIndex(b => b.id === active.id);
            const newIndex = blocks.findIndex(b => b.id === over.id);
            onBlocksChange(arrayMove(blocks, oldIndex, newIndex));
        }
    };

    const handleAddBlock = (type) => {
        const newBlock = {
            id: `temp-${Date.now()}`, // Temporary ID until saved
            type,
            position: blocks.length,
            metadata: {}
        };
        onBlocksChange([...blocks, newBlock]);
        setAnchorEl(null);
    };

    const handleUpdateBlock = (id, metadata) => {
        const updated = blocks.map(b => b.id === id ? { ...b, metadata } : b);
        onBlocksChange(updated);
    };

    const handleDeleteBlock = (id) => {
        if (confirm('Delete this block?')) {
            onBlocksChange(blocks.filter(b => b.id !== id));
        }
    };

    return (
        <Box sx={{ mt: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom>Lesson Content</Typography>
            
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={blocks.map(b => b.id)} 
                    strategy={verticalListSortingStrategy}
                >
                    {blocks.map((block, index) => (
                        <BlockItem 
                            key={block.id} 
                            id={block.id}
                            block={block} 
                            index={index}
                            onChange={handleUpdateBlock}
                            onDelete={handleDeleteBlock}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            <Box sx={{ textAlign: 'center', mt: 4, mb: 8 }}>
                <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    Add Content Block
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                >
                    <MenuItem onClick={() => handleAddBlock('VIDEO')}>Video</MenuItem>
                    <MenuItem onClick={() => handleAddBlock('RICHTEXT')}>Text</MenuItem>
                    <MenuItem onClick={() => handleAddBlock('QUIZ')}>Quiz</MenuItem>
                    <MenuItem onClick={() => handleAddBlock('ASSIGNMENT')}>Assignment</MenuItem>
                    <Divider />
                    <MenuItem onClick={() => handleAddBlock('DOCUMENT')}>Document / File</MenuItem>
                </Menu>
            </Box>
        </Box>
    );
};

export default BlockManager;
