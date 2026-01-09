/**
 * Instructor Content Block Editor
 * Block-based rich content editing for lessons
 */

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
} from '@mui/material';
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconGripVertical,
  IconEdit,
  IconPhoto,
  IconVideo,
  IconMusic,
  IconFile,
  IconCode,
  IconCheck,
} from '@tabler/icons-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const BLOCK_TYPES = [
  { type: 'text', label: 'Text', icon: IconEdit },
  { type: 'image', label: 'Image', icon: IconPhoto },
  { type: 'video', label: 'Video', icon: IconVideo },
  { type: 'audio', label: 'Audio', icon: IconMusic },
  { type: 'file', label: 'File', icon: IconFile },
  { type: 'embed', label: 'Embed', icon: IconCode },
];

export default function Edit({ node, blocks: initialBlocks }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [editingBlock, setEditingBlock] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description);
  const [objectives, setObjectives] = useState(node.objectives);
  const [saving, setSaving] = useState(false);

  const handleSaveMeta = () => {
    setSaving(true);
    router.post(
      `/instructor/content/${node.id}/edit/`,
      { action: 'save_meta', title, description, objectives },
      { onFinish: () => setSaving(false) }
    );
  };

  const handleAddBlock = (type) => {
    setMenuAnchor(null);
    router.post(
      `/instructor/content/${node.id}/edit/`,
      { action: 'add_block', blockType: type, content: '' },
      { preserveScroll: true }
    );
  };

  const handleUpdateBlock = (blockId, content) => {
    router.post(
      `/instructor/content/${node.id}/edit/`,
      { action: 'update_block', blockId, content },
      { preserveScroll: true }
    );
    setEditingBlock(null);
  };

  const handleDeleteBlock = (blockId) => {
    if (!confirm('Delete this block?')) return;
    router.post(
      `/instructor/content/${node.id}/edit/`,
      { action: 'delete_block', blockId },
      { preserveScroll: true }
    );
  };

  const handleReorder = (newOrder) => {
    setBlocks(newOrder);
    router.post(
      `/instructor/content/${node.id}/edit/`,
      { action: 'reorder_blocks', order: newOrder.map(b => b.id) },
      { preserveScroll: true }
    );
  };

  const handleFileUpload = (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('blockType', type);
    
    router.post(`/instructor/content/${node.id}/edit/`, formData, {
      forceFormData: true,
      preserveScroll: true,
    });
  };

  const BlockIcon = ({ type }) => {
    const config = BLOCK_TYPES.find(b => b.type === type);
    const Icon = config?.icon || IconEdit;
    return <Icon size={18} />;
  };

  return (
    <>
      <Head title={`Edit: ${node.title}`} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Button
              component={Link}
              href="/instructor/content/"
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">Edit Content</Typography>
              <Typography color="text.secondary">
                {node.programName} • {node.nodeType}
              </Typography>
            </Box>
          </Stack>

          {/* Metadata Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lesson Details
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Learning Objectives"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                multiline
                rows={2}
                fullWidth
                placeholder="What will students learn from this lesson?"
              />
              <Button
                variant="contained"
                onClick={handleSaveMeta}
                disabled={saving}
                startIcon={<IconCheck />}
              >
                {saving ? 'Saving...' : 'Save Details'}
              </Button>
            </Stack>
          </Paper>

          {/* Content Blocks */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Content Blocks</Typography>
              <Button
                startIcon={<IconPlus />}
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                variant="outlined"
              >
                Add Block
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                  <MenuItem key={type} onClick={() => handleAddBlock(type)}>
                    <Icon size={18} style={{ marginRight: 8 }} />
                    {label}
                  </MenuItem>
                ))}
              </Menu>
            </Stack>

            {blocks.length === 0 ? (
              <Alert severity="info">
                No content blocks yet. Click "Add Block" to start building your lesson.
              </Alert>
            ) : (
              <Reorder.Group axis="y" values={blocks} onReorder={handleReorder}>
                <Stack spacing={2}>
                  <AnimatePresence>
                    {blocks.map((block) => (
                      <Reorder.Item key={block.id} value={block}>
                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" alignItems="flex-start" spacing={2}>
                              <IconButton sx={{ cursor: 'grab', mt: -0.5 }}>
                                <IconGripVertical size={18} />
                              </IconButton>
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                  <BlockIcon type={block.type} />
                                  <Typography variant="subtitle2" color="text.secondary">
                                    {block.type.toUpperCase()}
                                  </Typography>
                                </Stack>

                                {/* Block Content Display/Edit */}
                                {editingBlock === block.id ? (
                                  <BlockEditor
                                    block={block}
                                    onSave={(content) => handleUpdateBlock(block.id, content)}
                                    onCancel={() => setEditingBlock(null)}
                                  />
                                ) : (
                                  <BlockPreview block={block} />
                                )}
                              </Box>
                            </Stack>
                          </CardContent>
                          <Divider />
                          <CardActions sx={{ justifyContent: 'flex-end' }}>
                            {editingBlock !== block.id && (
                              <Button
                                size="small"
                                startIcon={<IconEdit size={14} />}
                                onClick={() => setEditingBlock(block.id)}
                              >
                                Edit
                              </Button>
                            )}
                            <Button
                              size="small"
                              color="error"
                              startIcon={<IconTrash size={14} />}
                              onClick={() => handleDeleteBlock(block.id)}
                            >
                              Delete
                            </Button>
                          </CardActions>
                        </Card>
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Stack>
              </Reorder.Group>
            )}
          </Paper>
        </motion.div>
      </Container>
    </>
  );
}

function BlockPreview({ block }) {
  switch (block.type) {
    case 'text':
      return (
        <Typography
          sx={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: block.content || '<em>Empty text block</em>' }}
        />
      );
    case 'image':
      return block.filePath ? (
        <img src={`/media/${block.filePath}`} alt={block.content} style={{ maxWidth: '100%', maxHeight: 300 }} />
      ) : (
        <Typography color="text.secondary">No image uploaded</Typography>
      );
    case 'video':
    case 'embed':
      return block.content ? (
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Embed: {block.content}
          </Typography>
        </Box>
      ) : (
        <Typography color="text.secondary">No embed URL set</Typography>
      );
    case 'audio':
      return block.filePath ? (
        <audio controls src={`/media/${block.filePath}`} style={{ width: '100%' }} />
      ) : (
        <Typography color="text.secondary">No audio uploaded</Typography>
      );
    case 'file':
      return block.fileName ? (
        <Typography>📎 {block.fileName}</Typography>
      ) : (
        <Typography color="text.secondary">No file uploaded</Typography>
      );
    default:
      return <Typography color="text.secondary">Unknown block type</Typography>;
  }
}

function BlockEditor({ block, onSave, onCancel }) {
  const [content, setContent] = useState(block.content || '');

  const isTextType = ['text', 'embed'].includes(block.type);

  return (
    <Stack spacing={2}>
      {isTextType ? (
        <TextField
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          rows={block.type === 'text' ? 6 : 2}
          fullWidth
          placeholder={block.type === 'embed' ? 'Paste YouTube/Vimeo URL...' : 'Enter content...'}
        />
      ) : (
        <Typography color="text.secondary">
          Use the file upload to replace content for this block type.
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        <Button variant="contained" size="small" onClick={() => onSave(content)}>
          Save
        </Button>
        <Button variant="outlined" size="small" onClick={onCancel}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}
