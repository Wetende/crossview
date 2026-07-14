/**
 * Admin Program Detail Page
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Autocomplete,
  TextField,
} from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DashboardLayout from '@/layouts/DashboardLayout';


import { tokens } from './programRecordTokens';
import { Eyebrow, PageTitle, StatusStamp } from './Show.styles';
import { useState } from 'react';

export default function ProgramShow({ program, stats, instructors = [], availableInstructors = [], readiness = {} }) {
  const [publishOpen, setPublishOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedInstructors, setSelectedInstructors] = useState(instructors.map(i => i.id));

  const handlePublish = () => {
    router.post(`/admin/programs/${program.id}/publish/`, {}, {
      onSuccess: () => setPublishOpen(false),
    });
  };

  const handleFeaturedToggle = () => {
    router.post(`/admin/programs/${program.id}/featured/`, {}, {
      preserveScroll: true,
    });
  };

  const handleAssignSave = () => {
    router.post(`/admin/programs/${program.id}/assign-instructors/`, {
      instructorIds: selectedInstructors
    }, {
      onSuccess: () => setAssignModalOpen(false)
    });
  };

  const handleChipClick = () => {
    setPublishOpen(true);
  };

  // Removed unused StatItem since we use the new Tally grid directly

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Programs', href: '/admin/programs/' },
        { label: program.name },
      ]}
    >
      <Head title={`Program: ${program.name}`} />

      <Stack spacing={3}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3, width: '100%' }}>
          <Typography component={Link} href="/admin/programs/" sx={{
            fontSize: 12, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: tokens.muted, textDecoration: 'none',
          }}>
            ← Back to programmes
          </Typography>

	          <Stack direction="row" gap={1.25} flexWrap="wrap">
	            <Button
	              onClick={handleFeaturedToggle}
	              variant="outlined"
	              startIcon={program.isFeatured ? <StarBorderIcon /> : <StarIcon />}
	              sx={{ borderColor: tokens.hairline, color: tokens.inkSoft }}
	            >
	              {program.isFeatured ? 'Remove featured' : 'Make featured'}
	            </Button>
	            <Button
	              component={Link}
	              href={`/admin/programs/${program.id}/edit/`}
              variant="outlined"
              sx={{ borderColor: tokens.hairline, color: tokens.inkSoft }}
            >
              Edit
            </Button>
            <Button
              component={Link}
              href={`/instructor/programs/${program.id}/manage/`}
              variant="contained"
              sx={{ bgcolor: tokens.blue, '&:hover': { bgcolor: tokens.blueDeep } }}
            >
              Course manager
            </Button>
          </Stack>
        </Box>

        {/* Wrapper for Animation */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
            <Stack spacing={3}>
                {/* Registry Card */}
                <Paper variant="outlined" sx={{
                  position: 'relative', borderColor: tokens.hairline, borderRadius: '4px',
                  p: { xs: 3, sm: '40px 44px 32px' }, bgcolor: tokens.card,
                }}>
                  <Eyebrow>Programme</Eyebrow>
                  <PageTitle component="h1">{program.name}</PageTitle>
                  <Typography sx={{ color: tokens.muted, fontSize: 15 }}>
                    {program.examBody ? `${program.examBody} · ${program.level || 'No level'}` : 'Independent Course'}
                  </Typography>

                  <StatusStamp
                      statuscolor={program.isPublished ? tokens.blue : tokens.red}
                      onClick={handleChipClick}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: 13, letterSpacing: '0.08em' }}>
                      {program.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </Typography>
                  </StatusStamp>

	                  <Box sx={{
	                    display: 'grid',
	                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(6, 1fr)' },
	                    rowGap: 2.25, mt: 3.5, pt: 2.75, borderTop: `1px solid ${tokens.hairline}`,
	                  }}>
	                    {[
	                      ['Programme code', program.code || '-'],
	                      ['Examining body', program.examBody || 'Independent'],
	                      ['Award type', program.awardType || '-'],
	                      ['Assessment mode', program.assessmentMode || 'Continuous Mark Assessment'],
	                      ['Featured', program.isFeatured ? 'Yes' : 'No'],
	                      ['Created on', new Date(program.createdAt).toLocaleDateString(undefined, {
	                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                      })],
                    ].map(([label, value]) => (
                      <Box key={label} sx={{
                        px: { sm: 2.25 },
                        borderLeft: { sm: label === 'Programme code' ? 'none' : `1px solid ${tokens.hairline}` },
                        pl: { xs: 0, sm: label === 'Programme code' ? 0 : 2.25 }
                      }}>
                        <Eyebrow sx={{ display: 'block', mb: 0.75, fontSize: 10 }}>{label}</Eyebrow>
                        <Typography sx={{ fontSize: 14.5, fontWeight: 500, color: tokens.ink }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Tally strip */}
                <Box sx={{
                  display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  mt: 3, bgcolor: tokens.card, border: `1px solid ${tokens.hairline}`, borderRadius: '4px', overflow: 'hidden',
                }}>
                  {[
                    ['Total enrolments', stats.enrollmentCount, tokens.blue],
                    ['Active students', stats.activeEnrollments, tokens.red],
                    ['Completed', stats.completedEnrollments, tokens.blue],
                  ].map(([label, value, tick], i) => (
                    <Box key={label} sx={{
                      p: '26px 28px',
                      borderLeft: i === 0 ? 'none' : { sm: `1px solid ${tokens.hairline}` },
                      borderTop: i === 0 ? 'none' : { xs: `1px solid ${tokens.hairline}`, sm: 'none' },
                    }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 38, color: tokens.ink, lineHeight: 1 }}>
                        {value}
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={1} mt={1.25}>
                        <Box sx={{ width: 10, height: 3, borderRadius: '1px', bgcolor: tick }} />
                        <Typography sx={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: tokens.muted }}>
                          {label}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Box>

                {/* Main Content Layout */}
                        {/* Description */}
                        <Paper variant="outlined" sx={{ borderColor: tokens.hairline, borderRadius: '4px', p: { xs: 3, sm: '40px 44px' }, bgcolor: tokens.card }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Course Description</Typography>
                            {program.description ? (
                                <Typography sx={{ color: tokens.inkSoft, fontSize: 15, lineHeight: 1.7, maxWidth: '900px' }}>
                                  {program.description}
                                </Typography>
                            ) : (
                                <Typography sx={{ color: tokens.muted, fontStyle: 'italic', fontSize: 15 }}>
                                    No description provided for this program.
                                </Typography>
                            )}
                        </Paper>

                        {/* Instructors */}
                        <Paper variant="outlined" sx={{ borderColor: tokens.hairline, borderRadius: '4px', p: { xs: 3, sm: '40px 44px' }, bgcolor: tokens.card }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Assigned Instructors</Typography>
                                {instructors.length > 0 && (
                                    <Button 
                                      onClick={() => {
                                        setSelectedInstructors(instructors.map(i => i.id));
                                        setAssignModalOpen(true);
                                      }}
                                      variant="outlined" 
                                      size="small"
                                      sx={{ borderColor: tokens.hairline, color: tokens.inkSoft }}
                                    >
                                      + Manage instructors
                                    </Button>
                                )}
                            </Box>
                            {instructors.length === 0 ? (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, pt: 2, borderTop: `1px dashed ${tokens.hairline}`, width: '100%' }}>
                                <Typography sx={{ fontStyle: 'italic', fontSize: 13.5, color: tokens.muted }}>
                                  — vacant —
                                </Typography>
                                <Button 
                                  onClick={() => {
                                    setSelectedInstructors(instructors.map(i => i.id));
                                    setAssignModalOpen(true);
                                  }}
                                  variant="outlined" 
                                  sx={{ borderColor: tokens.hairline, color: tokens.inkSoft }}
                                >
                                  + Assign instructor
                                </Button>
                              </Box>
                            ) : (
                              <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderColor: tokens.hairline }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.muted }}>Name</TableCell>
                                      <TableCell sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.muted }}>Email</TableCell>
                                      <TableCell sx={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.muted }}>Role</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {instructors.map((instructor) => (
                                      <TableRow key={instructor.id}>
                                        <TableCell sx={{ color: tokens.ink, fontWeight: 500 }}>{instructor.name}</TableCell>
                                        <TableCell sx={{ color: tokens.inkSoft }}>{instructor.email}</TableCell>
                                        <TableCell>
                                          <Chip
                                            label={instructor.role}
                                            size="small"
                                            sx={{
                                                bgcolor: tokens.paper, color: tokens.ink,
                                                fontSize: 11,
                                                borderRadius: '4px'
                                            }}
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}
                        </Paper>

            </Stack>
        </motion.div>
      </Stack>

      {/* Publish/Readiness Dialog */}
      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
           {program.isPublished ? 'Unpublish Program?' : 'Pre-Publish Checklist'}
        </DialogTitle>
        <DialogContent>
            {program.isPublished ? (
                <Typography>
                    Are you sure you want to unpublish <strong>{program.name}</strong>?
                    This will hide the course and all its content from students immediately.
                </Typography>
            ) : (
                <Stack spacing={2}>
                    <Typography gutterBottom>
                         Review the following requirements before publishing:
                    </Typography>

                    <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                        {readiness.checks && readiness.checks.map((check, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    {check.passed ? (
                                        <CheckCircleIcon color="success" />
                                    ) : (
                                        <CancelIcon color="error" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={check.label}
                                  secondary={!check.passed && (check.error || "Please complete this requirement before publishing.")}
                                    primaryTypographyProps={{
                                        color: check.passed ? 'text.primary' : 'error.main',
                                        fontWeight: check.passed ? 'medium' : 'bold'
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>

                    {!readiness.isReady && (
                        <Alert severity="error">
                            You cannot publish this program until all checks pass.
                        </Alert>
                    )}

                    {readiness.isReady && (
                        <Alert severity="success">
                            All systems go! This course is ready to be published.
                        </Alert>
                    )}
                </Stack>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button
                variant="contained"
                color={program.isPublished ? "error" : "success"}
                disabled={!program.isPublished && !readiness.isReady}
                onClick={handlePublish}
                autoFocus
            >
                {program.isPublished ? 'Unpublish' : 'Confirm Publish'}
            </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: tokens.ink }}>
          Assign Instructors
        </DialogTitle>
        <DialogContent dividers>
          <Autocomplete
            multiple
            options={availableInstructors}
            getOptionLabel={(option) => option.name || option.email}
            value={availableInstructors.filter(i => selectedInstructors.includes(i.id))}
            onChange={(event, newValue) => {
              setSelectedInstructors(newValue.map(i => i.id));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Select instructors..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': { borderColor: tokens.blue },
                  }
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={option.name || option.email}
                    {...tagProps}
                    sx={{ borderColor: tokens.hairline, bgcolor: tokens.paper }}
                  />
                );
              })
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setAssignModalOpen(false)} sx={{ color: tokens.muted }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignSave}
            variant="contained" 
            disableElevation
            sx={{ bgcolor: tokens.blue, '&:hover': { bgcolor: tokens.blueDeep } }}
          >
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
