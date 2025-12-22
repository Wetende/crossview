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
    }
  }, [node, nodeType]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
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
