/**
 * Instructor Content Index
 * Lists curriculum content for all assigned programs
 */

import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';

import DashboardLayout from '../../../components/layouts/DashboardLayout';

// Recursive component to render curriculum tree
function CurriculumTree({ nodes, searchTerm, level = 0 }) {
  const filteredNodes = searchTerm
    ? nodes.filter(node => 
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.children?.some(child => 
          child.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : nodes;

  if (filteredNodes.length === 0) return null;

  return (
    <List dense disablePadding>
      {filteredNodes.map((node) => (
        <Box key={node.id}>
          <ListItem
            sx={{
              pl: level * 3,
              bgcolor: level === 0 ? 'grey.50' : 'transparent',
              borderRadius: 1,
              mb: 0.5,
            }}
          >
            {node.children?.length > 0 ? (
              <FolderIcon color="action" sx={{ mr: 1 }} />
            ) : (
              <ArticleIcon color="primary" sx={{ mr: 1 }} />
            )}
            <ListItemText
              primary={node.title}
              secondary={node.type}
              primaryTypographyProps={{ fontWeight: level === 0 ? 'bold' : 'normal' }}
            />
            <ListItemSecondaryAction>
              <IconButton
                component={Link}
                href={`/instructor/content/${node.id}/edit/`}
                size="small"
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          
          {node.children?.length > 0 && (
            <CurriculumTree
              nodes={node.children}
              searchTerm={searchTerm}
              level={level + 1}
            />
          )}
        </Box>
      ))}
    </List>
  );
}

export default function ContentIndex({ programs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProgram, setExpandedProgram] = useState(programs[0]?.id || null);

  const breadcrumbs = [{ label: 'Course Content' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title="Course Content" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                <MenuBookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Course Content
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Edit session titles, descriptions, and learning materials
              </Typography>
            </Box>

            <TextField
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {programs.length === 0 ? (
            <Alert severity="info">
              No programs assigned. Contact your administrator to be assigned to programs.
            </Alert>
          ) : (
            <Box>
              {programs.map((program) => (
                <Accordion
                  key={program.id}
                  expanded={expandedProgram === program.id}
                  onChange={() => setExpandedProgram(
                    expandedProgram === program.id ? null : program.id
                  )}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6">{program.name}</Typography>
                      <Chip
                        label={`${program.nodes?.length || 0} items`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {program.nodes?.length > 0 ? (
                      <CurriculumTree
                        nodes={program.nodes}
                        searchTerm={searchTerm}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        No curriculum content yet
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Stack>
      </motion.div>
    </DashboardLayout>
  );
}
