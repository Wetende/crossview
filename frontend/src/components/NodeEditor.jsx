/**
 * NodeEditor Component
 * Form for creating/editing curriculum nodes
 * Requirements: FR-4.3, FR-4.4
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import BlockManager from './ContentBlocks/BlockManager';
import axios from 'axios';

export default function NodeEditor({
  mode = 'create',
  node = null,
  nodeType = '',
  parentNode = null,
  hierarchy = [],
  onSave,
  onDelete,
  onCancel,
}) {
  const isCreate = mode === 'create';

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    nodeType: nodeType,
    isPublished: false,
    properties: {},
    completionRules: {},
  });

  const [saving, setSaving] = useState(false);

  const [blocks, setBlocks] = useState([]);
  const [blocksLoaded, setBlocksLoaded] = useState(false);

  // Initialize form data when node changes
  useEffect(() => {
    if (node) {
      setFormData({
        title: node.title || '',
        code: node.code || '',
        description: node.description || '',
        nodeType: node.nodeType || '',
        isPublished: node.isPublished || false,
        properties: node.properties || {},
        completionRules: node.completionRules || {},
      });
      
      // Fetch Content Blocks
      fetchBlocks(node.id);
    } else {
      setFormData({
        title: '',
        code: '',
        description: '',
        nodeType: nodeType,
        isPublished: false,
        properties: {},
        completionRules: {},
      });
      setBlocks([]);
    }
  }, [node, nodeType]);

  const fetchBlocks = async (nodeId) => {
    try {
        // Assuming API endpoint exists from Phase 1
        const response = await axios.get(`/api/content/blocks/?node_id=${nodeId}`);
        // Backend returns generic blocks, map them to frontend expected format if needed
        const mappedBlocks = response.data.map(b => ({
            id: b.id,
            type: b.block_type,
            position: b.position,
            metadata: b.data
        }));
        setBlocks(mappedBlocks);
        setBlocksLoaded(true);
    } catch (err) {
        console.error("Failed to fetch blocks", err);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Save Node Metadata first
      await onSave(formData);
      
      // 2. Save Blocks (if node exists or was created)
      // Since onSave usually returns the node or we have it, we might need the ID.
      // For now, assuming editing existing node:
      if (node) {
          await saveBlocks(node.id, blocks);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveBlocks = async (nodeId, currentBlocks) => {
      // Logic: 
      // 1. New blocks have temp IDs (string) -> POST
      // 2. Existing blocks -> PATCH
      // 3. Removed blocks -> DELETE (handled via immediate delete in BlockManager, or here by diffing)
      
      // For simplicity in this iteration:
      // Loop and save/update each block. Ideally use a bulk endpoint.
      for (const block of currentBlocks) {
          const payload = {
              node: nodeId,
              block_type: block.type,
              position: block.position, // Ensure position is updated
              data: block.metadata
          };

          if (typeof block.id === 'string' && block.id.startsWith('temp-')) {
              await axios.post(`/api/content/blocks/`, payload);
          } else {
              await axios.patch(`/api/content/blocks/${block.id}/`, payload);
          }
      }
      // Reorder call
      const order = currentBlocks.filter(b => !b.id.toString().startsWith('temp')).map(b => b.id);
      if (order.length > 0) {
          await axios.post(`/api/content/blocks/reorder/`, { node_id: nodeId, order });
      }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              {isCreate ? 'Create' : 'Edit'} {formData.nodeType || 'Node'}
            </Typography>
            {parentNode && (
              <Typography variant="caption" color="text.secondary">
                Parent: {parentNode.title}
              </Typography>
            )}
          </Box>
          <Chip
            label={formData.nodeType}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>

        <Divider />

        {/* Basic Fields */}
        <TextField
          label="Title"
          value={formData.title}
          onChange={handleChange('title')}
          required
          fullWidth
          autoFocus
        />

        <TextField
          label="Code"
          value={formData.code}
          onChange={handleChange('code')}
          fullWidth
          helperText="Optional unique identifier"
        />

        <TextField
          label="Description"
          value={formData.description}
          onChange={handleChange('description')}
          multiline
          rows={3}
          fullWidth
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.isPublished}
              onChange={handleChange('isPublished')}
            />
          }
          label="Published"
        />

        <Divider />

        {/* Completion Rules (simplified) */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Completion Rules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Define how students complete this node
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.completionRules?.requireAllChildren || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      completionRules: {
                        ...prev.completionRules,
                        requireAllChildren: e.target.checked,
                      },
                    }))
                  }
                />
              }
              label="Require all children to be completed"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.completionRules?.requireAssessment || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      completionRules: {
                        ...prev.completionRules,
                        requireAssessment: e.target.checked,
                      },
                    }))
                  }
                />
              }
              label="Require assessment completion"
            />
          </Stack>
        </Box>

        <Divider />

        {/* Content Blocks (Only for Session/Lesson types) */}
        {(formData.nodeType === 'Session' || formData.nodeType === 'Lesson') && (
            <Box>
                <BlockManager 
                    blocks={blocks} 
                    onBlocksChange={setBlocks} 
                />
            </Box>
        )}

        <Divider />

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Box>
            {!isCreate && onDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving || !formData.title.trim()}
            >
              {saving ? 'Saving...' : isCreate ? 'Create' : 'Save'}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
