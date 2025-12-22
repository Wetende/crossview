/**
 * CurriculumTree Component
 * Displays hierarchical curriculum structure with optional editing
 * Requirements: FR-4.1, FR-4.2
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const nodeTypeIcons = {
  Year: FolderIcon,
  Unit: FolderIcon,
  Session: ArticleIcon,
  Module: FolderIcon,
  Lesson: ArticleIcon,
  Topic: ArticleIcon,
};

function TreeNode({
  node,
  hierarchy,
  depth = 0,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  editable,
}) {
  const [expanded, setExpanded] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const canAddChild = depth < hierarchy.length - 1;
  const Icon = nodeTypeIcons[node.nodeType] || ArticleIcon;

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClick = () => {
    onSelect?.(node);
  };

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddChild = () => {
    handleMenuClose();
    onAddChild?.(node);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(node.id);
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
      >
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.75,
            px: 1,
            ml: depth * 2,
            borderRadius: 1,
            cursor: 'pointer',
            bgcolor: isSelected ? 'primary.light' : 'transparent',
            color: isSelected ? 'primary.contrastText' : 'text.primary',
            '&:hover': {
              bgcolor: isSelected ? 'primary.light' : 'action.hover',
            },
          }}
        >
          {/* Expand/Collapse */}
          <IconButton
            size="small"
            onClick={handleToggle}
            sx={{
              visibility: hasChildren ? 'visible' : 'hidden',
              color: isSelected ? 'inherit' : 'action.active',
            }}
          >
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>

          {/* Icon */}
          <Icon
            fontSize="small"
            sx={{
              mr: 1,
              color: isSelected ? 'inherit' : 'action.active',
            }}
          />

          {/* Title */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              fontWeight={isSelected ? 'bold' : 'normal'}
            >
              {node.title}
            </Typography>
          </Box>

          {/* Type Badge */}
          <Chip
            label={node.nodeType}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              mr: 0.5,
              borderColor: isSelected ? 'primary.contrastText' : 'divider',
              color: isSelected ? 'inherit' : 'text.secondary',
            }}
          />

          {/* Published indicator */}
          {node.isPublished && (
            <CheckCircleIcon
              fontSize="small"
              color={isSelected ? 'inherit' : 'success'}
              sx={{ mr: 0.5 }}
            />
          )}

          {/* Actions Menu */}
          {editable && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ color: isSelected ? 'inherit' : 'action.active' }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </motion.div>

      {/* Children */}
      <Collapse in={expanded}>
        <AnimatePresence>
          {hasChildren &&
            node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                hierarchy={hierarchy}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onDelete={onDelete}
                editable={editable}
              />
            ))}
        </AnimatePresence>
      </Collapse>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {canAddChild && (
          <MenuItem onClick={handleAddChild}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Add {hierarchy[depth + 1]}</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default function CurriculumTree({
  nodes = [],
  hierarchy = [],
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  editable = false,
}) {
  return (
    <Box>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          hierarchy={hierarchy}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onDelete={onDelete}
          editable={editable}
        />
      ))}
    </Box>
  );
}
