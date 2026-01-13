import { useState } from 'react';
import { Head, router } from '@inertiajs/react'; 
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { TouchApp as TouchAppIcon } from '@mui/icons-material';
import CourseBuilderLayout from '@/layouts/CourseBuilderLayout';
import CurriculumBuilder, { flattenNodes } from './components/CurriculumBuilder';
import NodeEditor from './components/NodeEditor';
import SettingsPanel from './components/SettingsPanel';

export default function InstructorProgramManage({ program, curriculum }) {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

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
    >
      <Head title={`Manage ${program.name}`} />
      
      <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
             {/* Use full height and no padding for curriculum to match the sidebar design */}
             <Box sx={{ height: '100%', overflowY: 'hidden', p: activeTab === 'curriculum' ? 0 : 3 }}>
                 {activeTab === 'curriculum' && (
                    <Box sx={{ display: 'flex', height: '100%' }}>
                         {/* Pass onNodeSelect to update local state */}
                         <CurriculumBuilder 
                            program={program} 
                            nodes={curriculum} 
                            onNodeSelect={(node) => setSelectedNodeId(node ? node.id : null)} 
                         />
                         
                         {/* Right Panel: Content Editor */}
                         <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                            {selectedNode ? (
                                <NodeEditor 
                                    key={selectedNode.id} // Force remount on node change
                                    node={selectedNode} 
                                    onSave={handleNodeSave} 
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
                 {(activeTab === 'settings' || activeTab === 'pricing' || activeTab === 'faq' || activeTab === 'notice' || activeTab === 'drip') && (
                     <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                        <Card>
                            <CardContent>
                                <SettingsPanel program={program} activeTab={activeTab} curriculum={curriculum} />
                            </CardContent>
                        </Card>
                     </Box>
                 )}
             </Box>
      </Box>
    </CourseBuilderLayout>
  );
}
