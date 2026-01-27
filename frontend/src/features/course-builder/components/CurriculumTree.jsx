import React, { useState, useRef } from 'react';
import SearchMaterialsModal from './SearchMaterialsModal';
import { router } from '@inertiajs/react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Box,
    Typography,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Search as SearchIcon,
    Article as ArticleIcon,
    OndemandVideo as VideoIcon,
    VideoCameraFront as ZoomIcon,
    Cast as StreamIcon,
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// Helper to flatten node tree for diffing
export const flattenNodes = (nodes) => {
    if (!nodes) return [];
    let result = [];
    nodes.forEach(node => {
        result.push(node);
        if (node.children && node.children.length > 0) {
            result = result.concat(flattenNodes(node.children));
        }
    });
    return result;
};

export default function CurriculumTree({ program, nodes, onNodeSelect, blueprint }) {
    // Get feature flags from blueprint (with defaults)
    const featureFlags = blueprint?.featureFlags || {
        quizzes: true, assignments: true, practicum: false, portfolio: false, gamification: false
    };
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [localNodes, setLocalNodes] = useState(nodes);
    
    // Update local nodes when props change
    React.useEffect(() => setLocalNodes(nodes), [nodes]);
    
    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = localNodes.findIndex((n) => n.id === active.id);
            const newIndex = localNodes.findIndex((n) => n.id === over.id);
            const reordered = arrayMove(localNodes, oldIndex, newIndex);
            setLocalNodes(reordered);
            
            // Call backend to persist order
            router.post(`/instructor/programs/${program.id}/nodes/reorder/`, {
                ordered_ids: reordered.map(n => n.id)
            }, { preserveScroll: true });
        }
    };
    
    // Create Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createQuizModalOpen, setCreateQuizModalOpen] = useState(false);
    const [createParentId, setCreateParentId] = useState(null);
    const [createType, setCreateType] = useState('section'); // 'section' or specific lesson type
    const [createTitle, setCreateTitle] = useState('');
    const [quizTitle, setQuizTitle] = useState('');
    
    // Expanded state for sections
    const [expandedSections, setExpandedSections] = useState({});
    
    // Inline editing state for section titles
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editingSectionTitle, setEditingSectionTitle] = useState('');
    
    const startEditingSection = (node, e) => {
        e.stopPropagation();
        setEditingSectionId(node.id);
        setEditingSectionTitle(node.title);
    };
    
    const saveSectionTitle = () => {
        if (editingSectionId && editingSectionTitle.trim()) {
            router.post(`/instructor/nodes/${editingSectionId}/update/`, {
                title: editingSectionTitle.trim()
            }, {
                preserveScroll: true,
                onSuccess: () => setEditingSectionId(null),
            });
        }
        setEditingSectionId(null);
    };
    
    const handleSectionTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveSectionTitle();
        } else if (e.key === 'Escape') {
            setEditingSectionId(null);
        }
    };
    
    // Search Modal State
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchTargetSectionId, setSearchTargetSectionId] = useState(null);
    const [searchTargetSectionName, setSearchTargetSectionName] = useState('');
    
    const openSearchModal = (sectionId, sectionName) => {
        setSearchTargetSectionId(sectionId);
        setSearchTargetSectionName(sectionName);
        setSearchModalOpen(true);
    };


    const toggleSection = (nodeId) => {
        setExpandedSections(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const handleSelect = (node) => {
        setSelectedNodeId(node.id);
        if (onNodeSelect) onNodeSelect(node);
    };

    const openCreateSection = () => {
        setCreateParentId(null);
        setCreateType('section');
        setCreateTitle('');
        setCreateModalOpen(true);
    };

    const oldIdsRef = useRef(new Set());

    const openCreateLesson = (parentId) => {
        setCreateParentId(parentId);
        setCreateType('lesson_select');
        setCreateModalOpen(true);
    };

    const handleLessonTypeSelect = (type) => {
        if (type === 'quiz') {
            setCreateModalOpen(false);
            setQuizTitle('');
            setCreateQuizModalOpen(true);
            return;
        }

        const payload = {
            parent_id: createParentId,
            title: 'Untitled Lesson',
            type: type === 'assignment' ? 'Assignment' : 'Lesson',
            properties: { lesson_type: type }
        };
        
        // Capture current IDs before request
        oldIdsRef.current = new Set(flattenNodes(nodes).map(n => n.id));
        
        router.post(`/instructor/programs/${program.id}/nodes/create/`, payload, {
            onSuccess: (page) => {
                setCreateModalOpen(false);
                const oldIds = oldIdsRef.current;
                const newNodesFlat = flattenNodes(page.props.curriculum);
                const createdNode = newNodesFlat.find(n => !oldIds.has(n.id));
                console.log('Create Success. Old IDs:', oldIds.size, 'New IDs:', newNodesFlat.length, 'Created:', createdNode);
                if (createdNode) {
                    handleSelect(createdNode);
                } else {
                    console.warn('Could not identify created node to select.');
                    // Fallback: Try to select the node with the highest ID if it wasn't in old list
                    if (newNodesFlat.length > oldIds.size) {
                         const maxIdNode = newNodesFlat.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                         if (!oldIds.has(maxIdNode.id)) {
                             handleSelect(maxIdNode);
                         }
                    }
                }
            },
        });
    };

    const handleCreateQuiz = () => {
        if (!quizTitle.trim()) return;
        const payload = {
            parent_id: createParentId,
            title: quizTitle,
            type: 'Quiz',
            properties: { lesson_type: 'quiz' }
        };

        // Capture current IDs before request
        oldIdsRef.current = new Set(flattenNodes(nodes).map(n => n.id));

        router.post(`/instructor/programs/${program.id}/nodes/create/`, payload, {
            onSuccess: (page) => {
                setCreateQuizModalOpen(false);
                const oldIds = oldIdsRef.current;
                const newNodesFlat = flattenNodes(page.props.curriculum);
                const createdNode = newNodesFlat.find(n => !oldIds.has(n.id));
                if (createdNode) handleSelect(createdNode);
            },
        });
    };

    const handleCreateSection = () => {
        if (!createTitle.trim()) return;
        router.post(`/instructor/programs/${program.id}/nodes/create/`, {
            parent_id: null,
            title: createTitle,
            type: 'Module', // Generic type, backend maps to Year/Unit based on parent/depth
        }, {
            onSuccess: (page) => {
                setCreateModalOpen(false);
                const oldIds = new Set(flattenNodes(nodes).map(n => n.id));
                const newNodesFlat = flattenNodes(page.props.curriculum);
                const createdNode = newNodesFlat.find(n => !oldIds.has(n.id));
                if (createdNode) handleSelect(createdNode);
            },
        });
    };

    const handleDelete = (nodeId) => {
        if(confirm("Are you sure? This will delete all children nodes and content.")) {
            router.post(`/instructor/nodes/${nodeId}/delete/`);
            if (selectedNodeId === nodeId) {
                setSelectedNodeId(null);
                if (onNodeSelect) onNodeSelect(null);
            }
        }
    };

    // Render a single leaf item
    const renderLeaf = (node) => {
        const isSelected = selectedNodeId === node.id;
        let Icon = ArticleIcon;
        if (node.properties?.lesson_type === 'video') Icon = VideoIcon;
        else if (node.properties?.lesson_type === 'live_class') Icon = ZoomIcon;
        else if (node.type === 'Quiz') Icon = QuizIcon;
        else if (node.type === 'Assignment') Icon = AssignmentIcon;

        return (
            <ListItem 
                key={node.id} 
                disablePadding 
                sx={{ mb: 0.5 }}
            >
                <ListItemButton 
                    selected={isSelected}
                    onClick={() => handleSelect(node)}
                    sx={{ 
                        borderRadius: 1, 
                        py: 0.5, 
                        px: 1,
                        '&.Mui-selected': { bgcolor: 'primary.lighter', color: 'primary.main' }
                    }}
                >
                    <Box component={DragIcon} sx={{ color: 'text.disabled', fontSize: 16, mr: 1, cursor: 'grab' }} />
                    <Box component={Icon} sx={{ color: isSelected ? 'primary.main' : 'warning.main', fontSize: 18, mr: 1.5 }} />
                    <ListItemText 
                        primary={node.title} 
                        primaryTypographyProps={{ variant: 'body2', fontSize: '0.9rem' }} 
                    />
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}>
                        <DeleteIcon fontSize="small" sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </IconButton>
                </ListItemButton>
            </ListItem>
        );
    };

    // Render a toggleable Section
    const renderSection = (node) => {
        const isExpanded = expandedSections[node.id] !== false;
        const isEditing = editingSectionId === node.id;
        
        return (
            <Paper 
                key={node.id} 
                variant="outlined" 
                sx={{ 
                    mb: 2, 
                    overflow: 'hidden', 
                    borderColor: selectedNodeId === node.id ? 'primary.main' : 'divider'
                }}
            >
                <Box 
                    sx={{ 
                        p: 1.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        bgcolor: 'background.paper',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => !isEditing && toggleSection(node.id)}
                >
                    <Box component={DragIcon} sx={{ color: 'text.disabled', mr: 1, cursor: 'grab' }} />
                    
                    {isEditing ? (
                        <TextField
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            onBlur={saveSectionTitle}
                            onKeyDown={handleSectionTitleKeyDown}
                            autoFocus
                            size="small"
                            variant="standard"
                            onClick={(e) => e.stopPropagation()}
                            InputProps={{ sx: { fontWeight: 'bold', fontSize: '0.875rem' } }}
                            sx={{ flex: 1 }}
                        />
                    ) : (
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                            {node.title}
                        </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex' }}>
                        <IconButton size="small" onClick={(e) => startEditingSection(node, e)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleSection(node.id); }}>
                            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                    </Box>
                </Box>

                {isExpanded && (
                    <Box sx={{ p: 1 }}>
                        <List disablePadding>
                            {node.children?.map(child => renderLeaf(child))}
                        </List>
                        
                        <Stack direction="row" spacing={1} mt={1}>
                            <Button 
                                size="small" 
                                startIcon={<AddIcon />} 
                                variant="text" 
                                sx={{ bgcolor: '#e3f2fd', color: '#1976d2', textTransform: 'none', flex: 1, justifyContent: 'flex-start', '&:hover': { bgcolor: '#bbdefb' } }}
                                onClick={() => openCreateLesson(node.id)}
                            >
                                Add a lesson
                            </Button>
                            <Button 
                                size="small" 
                                startIcon={<SearchIcon />} 
                                sx={{ bgcolor: 'action.hover', color: 'text.secondary', textTransform: 'none', px: 2, minWidth: 'auto' }}
                                onClick={() => openSearchModal(node.id, node.title)}
                            >
                                Search
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 128px)' }}>
            <Paper 
                variant="outlined" 
                sx={{ 
                    width: 320, 
                    flexShrink: 0, 
                    display: 'flex', 
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    mr: 3,
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Curriculum</Typography>
                     {/* Placeholder for Import SCORM if needed later */}
                     <Box />
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'background.default' }}>
                     {!localNodes || localNodes.length === 0 ? (
                         <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                             <Typography variant="body2">No curriculum yet.</Typography>
                             <Typography variant="caption">Start by adding a {program.blueprint?.hierarchy_structure?.[0] || 'Section'}.</Typography>
                         </Box>
                     ) : (
                         <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                             <SortableContext items={localNodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                                 {localNodes.map(node => renderSection(node))}
                             </SortableContext>
                         </DndContext>
                     )}
                </Box>
                {/* Footer Add Section Button */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={openCreateSection}
                        sx={{ textTransform: 'none', borderRadius: 1 }}
                    >
                        New section
                    </Button>
                </Box>
            </Paper>

            {/* Dialogs */}
            <Dialog 
                open={createModalOpen || createQuizModalOpen} 
                onClose={() => { setCreateModalOpen(false); setCreateQuizModalOpen(false); }}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {createQuizModalOpen ? 'Create Quiz' : (
                        createType === 'section' ? 'New Section' : 
                        createType === 'lesson_select' ? 'Select Lesson Type' : 'New Lesson'
                    )}
                    <IconButton size="small" onClick={() => { setCreateModalOpen(false); setCreateQuizModalOpen(false); }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {createType === 'lesson_select' && !createQuizModalOpen ? (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{ bgcolor: 'grey.100', px: 2, py: 1 }}><Typography variant="subtitle2" color="text.secondary">Learning Content</Typography></Box>
                                <List disablePadding>
                                    {[
                                        { id: 'text', icon: <ArticleIcon />, label: 'Text Lesson' },
                                        { id: 'video', icon: <VideoIcon />, label: 'Video Lesson' },
                                        { id: 'live_class', icon: <ZoomIcon />, label: 'Live Class' },
                                    ].map(type => (
                                        <ListItemButton key={type.id} onClick={() => handleLessonTypeSelect(type.id)}>
                                            <Box component="span" sx={{ mr: 2, color: 'text.secondary', display: 'flex' }}>{type.icon}</Box>
                                            <ListItemText primary={type.label} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Box>
                            
                            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                <Box sx={{ bgcolor: 'grey.100', px: 2, py: 1 }}><Typography variant="subtitle2" color="text.secondary">Assessments</Typography></Box>
                                <List disablePadding>
                                    <ListItemButton onClick={() => handleLessonTypeSelect('quiz')}>
                                        <Box component="span" sx={{ mr: 2, color: 'text.secondary', display: 'flex' }}><QuizIcon /></Box>
                                        <ListItemText primary="Quiz" secondary="Test student knowledge" />
                                    </ListItemButton>
                                    <ListItemButton onClick={() => handleLessonTypeSelect('assignment')}>
                                        <Box component="span" sx={{ mr: 2, color: 'text.secondary', display: 'flex' }}><AssignmentIcon /></Box>
                                        <ListItemText primary="Assignment" secondary="Graded coursework" />
                                    </ListItemButton>
                                </List>
                            </Box>
                            
                            {/* Portfolio - only for programs that support it */}
                            {featureFlags.portfolio && (
                                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                                    <Box sx={{ bgcolor: 'grey.100', px: 2, py: 1 }}><Typography variant="subtitle2" color="text.secondary">Practical Skills</Typography></Box>
                                    <List disablePadding>
                                        <ListItemButton onClick={() => handleLessonTypeSelect('portfolio')}>
                                            <Box component="span" sx={{ mr: 2, color: 'text.secondary', display: 'flex' }}><AssignmentIcon /></Box>
                                            <ListItemText primary="Portfolio Entry" secondary="Evidence-based competency proof" />
                                        </ListItemButton>
                                    </List>
                                </Box>
                            )}
                        </Stack>
                    ) : createQuizModalOpen ? (
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Quiz Title"
                            fullWidth
                            variant="outlined"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                        />
                    ) : (
                        <TextField
                            autoFocus
                            margin="dense"
                            label={createType === 'section' ? "Section Name" : "Lesson Name"}
                            fullWidth
                            variant="outlined"
                            value={createTitle}
                            onChange={(e) => setCreateTitle(e.target.value)}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    {createType !== 'lesson_select' && (
                        <Button 
                            variant="contained" 
                            onClick={createQuizModalOpen ? handleCreateQuiz : handleCreateSection}
                        >
                            Create
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            
            {/* Search Materials Modal */}
            <SearchMaterialsModal
                open={searchModalOpen}
                onClose={() => setSearchModalOpen(false)}
                sectionName={searchTargetSectionName}
                sectionId={searchTargetSectionId}
                programId={program.id}
                onImportComplete={(count) => {
                    // Refresh the curriculum after import
                    router.reload({ only: ['curriculum'] });
                }}
            />
        </Box>
    );
}
