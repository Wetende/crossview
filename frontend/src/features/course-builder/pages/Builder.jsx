import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Drawer, // Added
  List, // Added
  ListItem, // Added
  ListItemText, // Added
  ListItemIcon, // Added
  Divider, // Added
  IconButton, // Added
  Stack, // Added
  Button, // Added
} from '@mui/material';
import { TouchApp as TouchAppIcon } from '@mui/icons-material';
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Added
import CloseIcon from '@mui/icons-material/Close'; // Added
import VisibilityIcon from '@mui/icons-material/Visibility'; // Added
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // Added
import DescriptionIcon from '@mui/icons-material/Description'; // Added
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Added
import Brightness7Icon from '@mui/icons-material/Brightness7'; // Added
import { useThemeMode } from '@/theme/index'; // Added
import CourseBuilderLayout from '@/layouts/CourseBuilderLayout';
import CurriculumTree, { flattenNodes } from '../components/CurriculumTree';
import EditorContainer from '../editors/EditorContainer';
import SettingsPanel from '../components/SettingsPanel';

const RIGHT_DRAWER_WIDTH = 300; // Define the width for the right drawer

export default function InstructorProgramBuilder({ program, curriculum: initialCurriculum, platformFeatures = {}, deploymentMode = 'custom' }) {
  const { mode, toggleMode } = useThemeMode(); // Added
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false); // Added state for guide drawer
  const [curriculum, setCurriculum] = useState(initialCurriculum);
  
  // Get reactive page props for curriculum updates
  const page = usePage();
  
  // Update curriculum when page props change (e.g., after creating a new node)
  useEffect(() => {
      if (page.props.curriculum) {
          console.log('[DEBUG] Builder: curriculum updated from page props:', page.props.curriculum);
          setCurriculum(page.props.curriculum);
      }
  }, [page.props.curriculum]);

  // Helper to find node by ID in the tree
  const findNode = (id) => {
      const flat = flattenNodes(curriculum);
      return flat.find(n => n.id === id);
  };

  const selectedNode = selectedNodeId ? findNode(selectedNodeId) : null;

  const handleNodeSave = (nodeId, data) => {
      router.post(`/instructor/nodes/${nodeId}/update/`, data, {
          preserveScroll: true,
      });
  };

  return (
    <CourseBuilderLayout
        program={program}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        platformFeatures={platformFeatures}
        deploymentMode={deploymentMode}
        // Pass the guide button to the layout's AppBar slot
        appBarActions={
            <Stack direction="row" spacing={1}>
                <IconButton onClick={toggleMode} color="inherit" sx={{ mr: 1 }}>
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Button
                    variant={guideOpen ? "contained" : "outlined"}
                    color="secondary"
                    startIcon={<MenuBookIcon />}
                    onClick={() => setGuideOpen(!guideOpen)}
                    sx={{ mr: 1 }}
                >
                    Guide
                </Button>
                <Button
                  startIcon={<VisibilityIcon />}
                  onClick={() => window.open(`/instructor/programs/${program.id}/preview/`, '_blank')}
                >
                    Preview
                </Button>
            </Stack>
        }
    >
      <Head title={`Manage ${program.name}`} />

      <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex' }}> {/* Added display: 'flex' */}
             {/* Use full height and no padding for curriculum to match the sidebar design */}
             <Box
                sx={{
                    height: '100%',
                    overflowY: 'hidden',
                    p: activeTab === 'curriculum' ? 0 : 3,
                    flexGrow: 1, // Allow this box to grow
                    mr: guideOpen ? `${RIGHT_DRAWER_WIDTH}px` : 0, // Adjust margin when guide is open
                    transition: 'margin 0.2s ease-out', // Smooth transition
                }}
             >
                 {activeTab === 'curriculum' && (
                    <Box sx={{ display: 'flex', height: '100%' }}>
                         {/* Pass onNodeSelect to update local state */}
                         <CurriculumTree
                             program={program}
                             nodes={curriculum}
                             onNodeSelect={(node) => {
                                 console.log('[DEBUG] Builder: onNodeSelect called with:', node);
                                 setSelectedNodeId(node ? node.id : null);
                             }}
                             onCurriculumUpdate={(newCurriculum) => {
                                 console.log('[DEBUG] Builder: onCurriculumUpdate called');
                                 setCurriculum(newCurriculum);
                             }}
                             blueprint={program.blueprint}
                          />

                          {/* Right Panel: Content Editor */}
                          <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                             {console.log('[DEBUG] Builder rendering selectedNode:', selectedNode)}
                             {selectedNode ? (
                                 <EditorContainer
                                     key={selectedNode.id} // Force remount on node change
                                     node={selectedNode}
                                     onSave={handleNodeSave}
                                     blueprint={program.blueprint}
                                 />
                             ) : (
                                 <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', flexDirection: 'column' }}>
                                     <Box component={TouchAppIcon} sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} />
                                     <Typography variant="h6">Select a lesson to edit</Typography>
                                     <Typography variant="body2">Or create a new one from the menu on the left.</Typography>
                                 </Box>
                             )}
                          </Box>
                    </Box>
                 )}
                 {(activeTab === 'settings' || activeTab === 'pricing' || activeTab === 'faq' || activeTab === 'notice' || activeTab === 'drip' || activeTab === 'practicum' || activeTab === 'prerequisites' || activeTab === 'access') && (
                     <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                        <Card>
                            <CardContent>
                                <SettingsPanel 
                                    program={program} 
                                    activeTab={activeTab} 
                                    curriculum={curriculum} 
                                    platformFeatures={platformFeatures}
                                    deploymentMode={deploymentMode}
                                />
                            </CardContent>
                        </Card>
                     </Box>
                 )}
             </Box>

        {/* Right Drawer: Course Guide */}
        <Drawer
            anchor="right"
            variant="persistent"
            open={guideOpen}
            sx={{
            width: RIGHT_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                width: RIGHT_DRAWER_WIDTH,
                boxSizing: 'border-box',
                mt: 8, // Below AppBar (assuming AppBar height is 64px)
                height: 'calc(100% - 64px)',
                borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
            },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Course Guide</Typography>
                    <IconButton size="small" onClick={() => setGuideOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Stack>

                {/* Learning Outcomes */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                        LEARNING OUTCOMES
                    </Typography>
                    {program.whatYouLearn && program.whatYouLearn.length > 0 ? (
                        <List dense>
                            {program.whatYouLearn.map((item, index) => (
                                <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#009688' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item}
                                        primaryTypographyProps={{ variant: 'body2', style: { whiteSpace: 'pre-wrap' } }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No learning outcomes defined.
                        </Typography>
                    )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Resources */}
                <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                        INSTRUCTOR RESOURCES
                    </Typography>
                     {program.resources && program.resources.length > 0 ? (
                        <List dense>
                            {program.resources.map((res) => (
                                <ListItem
                                    key={res.id}
                                    disablePadding
                                    sx={{ mb: 1, bgcolor: 'action.hover', borderRadius: 1 }}
                                >
                                    <Button
                                        component="a"
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        fullWidth
                                        color="inherit"
                                        sx={{
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            py: 1,
                                            textAlign: 'left'
                                        }}
                                        startIcon={res.ext === 'pdf' ? <PictureAsPdfIcon color="error" /> : <DescriptionIcon color="info" />}
                                    >
                                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                             <Typography variant="body2" noWrap>
                                                {res.title}
                                            </Typography>
                                             <Typography variant="caption" color="text.secondary">
                                                Click to Open
                                            </Typography>
                                        </Box>
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            No resources attached.
                        </Typography>
                    )}
                </Box>
            </Box>
        </Drawer>
      </Box>
    </CourseBuilderLayout>
  );
}

