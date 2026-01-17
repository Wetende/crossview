/**
 * Admin Curriculum Builder Page
 * Requirements: US-4.1, US-4.2, US-4.3, US-4.4, US-4.5
 */

import { useState, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

import DashboardLayout from '@/layouts/DashboardLayout';
import CurriculumTree from '@/components/CurriculumTree';
import NodeEditor from '@/components/NodeEditor';

// Configure axios for CSRF (required when mixing with session auth)
// Following Inertia architecture hybrid pattern - client-side tree updates for performance
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

export default function CurriculumBuilder({ program, hierarchy = [], tree = [] }) {
  const [nodes, setNodes] = useState(tree);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [parentForNew, setParentForNew] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSelectNode = useCallback((node) => {
    setSelectedNode(node);
    setIsCreating(false);
    setParentForNew(null);
  }, []);

  const handleAddChild = useCallback((parentNode) => {
    setSelectedNode(null);
    setIsCreating(true);
    setParentForNew(parentNode);
  }, []);

  const handleAddRoot = useCallback(() => {
    setSelectedNode(null);
    setIsCreating(true);
    setParentForNew(null);
  }, []);

  const handleCreateNode = async (nodeData) => {
    setError(null);
    try {
      // Use axios with automatic CSRF token handling
      const response = await axios.post('/admin/curriculum/nodes/create/', {
        programId: program.id,
        parentId: parentForNew?.id || null,
        ...nodeData,
      });

      const newNode = response.data;

      // Client-side tree update for performance
      if (parentForNew) {
        setNodes((prev) => addNodeToTree(prev, parentForNew.id, newNode));
      } else {
        setNodes((prev) => [...prev, newNode]);
      }

      setSuccess('Node created successfully');
      setIsCreating(false);
      setSelectedNode(newNode);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create node');
    }
  };

  const handleUpdateNode = async (nodeData) => {
    setError(null);
    try {
      // Use axios with automatic CSRF token handling
      const response = await axios.post(`/admin/curriculum/nodes/${selectedNode.id}/update/`, nodeData);

      const updatedNode = response.data;

      // Client-side tree update for performance
      setNodes((prev) => updateNodeInTree(prev, updatedNode));
      setSelectedNode(updatedNode);
      setSuccess('Node updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update node');
    }
  };

  const handleDeleteNode = async (nodeId) => {
    if (!confirm('Are you sure you want to delete this node and all its children?')) {
      return;
    }

    setError(null);
    try {
      // Use axios with automatic CSRF token handling
      await axios.post(`/admin/curriculum/nodes/${nodeId}/delete/`);

      // Client-side tree update for performance
      setNodes((prev) => removeNodeFromTree(prev, nodeId));
      setSelectedNode(null);
      setSuccess('Node deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete node');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setParentForNew(null);
  };

  // Get node type for new node based on parent depth
  const getNewNodeType = () => {
    if (!parentForNew) {
      return hierarchy[0] || 'Node';
    }
    const parentDepth = getNodeDepth(nodes, parentForNew.id);
    return hierarchy[parentDepth + 1] || 'Node';
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Programs', href: '/admin/programs/' },
        { label: program.name, href: `/admin/programs/${program.id}/` },
        { label: 'Curriculum Builder' },
      ]}
    >
      <Head title={`Curriculum: ${program.name}`} />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Button
              component={Link}
              href={`/admin/programs/${program.id}/`}
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Program
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Curriculum Builder
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {program.name} • {program.blueprintName || 'No Blueprint'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRoot}
            disabled={hierarchy.length === 0}
          >
            Add {hierarchy[0] || 'Node'}
          </Button>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {hierarchy.length === 0 ? (
          <Alert severity="warning">
            This program has no blueprint assigned. Please assign a blueprint first.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Tree Panel */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card sx={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Curriculum Structure
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      Hierarchy: {hierarchy.join(' → ')}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {nodes.length === 0 ? (
                      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        No curriculum nodes yet. Click "Add {hierarchy[0]}" to start.
                      </Typography>
                    ) : (
                      <CurriculumTree
                        nodes={nodes}
                        hierarchy={hierarchy}
                        selectedId={selectedNode?.id}
                        onSelect={handleSelectNode}
                        onAddChild={handleAddChild}
                        onDelete={handleDeleteNode}
                        editable
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Editor Panel */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card sx={{ height: 'calc(100vh - 280px)', overflow: 'auto' }}>
                  <CardContent>
                    {isCreating ? (
                      <NodeEditor
                        mode="create"
                        nodeType={getNewNodeType()}
                        parentNode={parentForNew}
                        hierarchy={hierarchy}
                        onSave={handleCreateNode}
                        onCancel={handleCancel}
                      />
                    ) : selectedNode ? (
                      <NodeEditor
                        mode="edit"
                        node={selectedNode}
                        hierarchy={hierarchy}
                        onSave={handleUpdateNode}
                        onDelete={() => handleDeleteNode(selectedNode.id)}
                        onCancel={() => setSelectedNode(null)}
                      />
                    ) : (
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          Select a node to edit or click "Add" to create a new one
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}
      </Stack>
    </DashboardLayout>
  );
}

// Helper functions for tree manipulation
function addNodeToTree(nodes, parentId, newNode) {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    if (node.children?.length > 0) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentId, newNode),
      };
    }
    return node;
  });
}

function updateNodeInTree(nodes, updatedNode) {
  return nodes.map((node) => {
    if (node.id === updatedNode.id) {
      return { ...node, ...updatedNode };
    }
    if (node.children?.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children, updatedNode),
      };
    }
    return node;
  });
}

function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (node.children?.length > 0) {
        return {
          ...node,
          children: removeNodeFromTree(node.children, nodeId),
        };
      }
      return node;
    });
}

function getNodeDepth(nodes, nodeId, depth = 0) {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return depth;
    }
    if (node.children?.length > 0) {
      const found = getNodeDepth(node.children, nodeId, depth + 1);
      if (found !== -1) return found;
    }
  }
  return -1;
}
