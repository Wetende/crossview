/**
 * Admin Programs List Page
 * Requirements: FR-3.1, US-3.1
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  Pagination,
} from '@mui/material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

import DashboardLayout from '@/layouts/DashboardLayout';

export default function ProgramsIndex({
  programs = [],
  blueprints = [],
  filters = {},
  pagination = {},
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [blueprint, setBlueprint] = useState(filters.blueprint || '');

  const handleMenuOpen = (event, program) => {
    setAnchorEl(event.currentTarget);
    setSelectedProgram(program);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProgram(null);
  };

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (blueprint) params.set('blueprint', blueprint);

    router.visit(`/admin/programs/?${params.toString()}`, {
      only: ['programs', 'pagination'],
      preserveState: true,
    });
  };

  const handlePageChange = (event, page) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    router.visit(`/admin/programs/?${params.toString()}`, {
      only: ['programs', 'pagination'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleDelete = () => {
    if (selectedProgram && confirm('Are you sure you want to delete this program?')) {
      router.post(`/admin/programs/${selectedProgram.id}/delete/`);
    }
    handleMenuClose();
  };

  const handlePublish = () => {
    if (selectedProgram) {
      router.post(`/admin/programs/${selectedProgram.id}/publish/`);
    }
    handleMenuClose();
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Programs' }]}
    >
      <Head title="Programs" />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Programs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage academic programs and courses
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/programs/create/"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create Program
          </Button>
        </Box>

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2} 
              alignItems={{ xs: 'stretch', md: 'flex-end' }}
            >
              <TextField
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                sx={{ 
                  minWidth: { xs: '100%', md: 200 },
                  maxWidth: { md: 300 },
                }}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              />
              <FormControl size="small" fullWidth sx={{ minWidth: { xs: '100%', md: 150 }, maxWidth: { md: 180 } }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth sx={{ minWidth: { xs: '100%', md: 200 }, maxWidth: { md: 250 } }}>
                <InputLabel>Blueprint</InputLabel>
                <Select
                  value={blueprint}
                  label="Blueprint"
                  onChange={(e) => setBlueprint(e.target.value)}
                >
                  <MenuItem value="">All Blueprints</MenuItem>
                  {blueprints.map((bp) => (
                    <MenuItem key={bp.id} value={bp.id}>
                      {bp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleFilter}
                fullWidth
                sx={{ 
                  minWidth: { xs: '100%', md: 'auto' },
                  maxWidth: { md: 120 },
                }}
              >
                Filter
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Programs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Blueprint</TableCell>
                  <TableCell>Enrollments</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {programs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No programs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  programs.map((program) => (
                    <TableRow key={program.id} hover>
                      <TableCell>
                        <Link
                          href={`/admin/programs/${program.id}/`}
                          style={{ textDecoration: 'none' }}
                        >
                          <Typography fontWeight="medium" color="primary">
                            {program.name}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell>{program.code || '-'}</TableCell>
                      <TableCell>
                        {program.blueprintName ? (
                          <Chip
                            label={program.blueprintName}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{program.enrollmentCount}</TableCell>
                      <TableCell>
                        <Chip
                          label={program.isPublished ? 'Published' : 'Draft'}
                          size="small"
                          color={program.isPublished ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, program)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            component={Link}
            href={selectedProgram ? `/admin/programs/${selectedProgram.id}/` : '#'}
          >
            View Details
          </MenuItem>
          <MenuItem
            component={Link}
            href={selectedProgram ? `/admin/programs/${selectedProgram.id}/edit/` : '#'}
          >
            Edit
          </MenuItem>
          <MenuItem
            component={Link}
            href={selectedProgram ? `/instructor/programs/${selectedProgram.id}/manage/` : '#'}
          >
            Course Manager
          </MenuItem>
          <MenuItem onClick={handlePublish}>
            {selectedProgram?.isPublished ? 'Unpublish' : 'Publish'}
          </MenuItem>
          {selectedProgram?.enrollmentCount === 0 && (
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              Delete
            </MenuItem>
          )}
        </Menu>
      </Stack>
    </DashboardLayout>
  );
}
