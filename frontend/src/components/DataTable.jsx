/**
 * DataTable Component
 * Reusable table with sorting, pagination, and row actions
 * Requirements: Multiple list pages
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Pagination,
  Stack,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function DataTable({
  columns = [],
  rows = [],
  pagination = null,
  onPageChange,
  onSort,
  sortBy = '',
  sortOrder = 'asc',
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  actions = [],
  emptyMessage = 'No data found',
  loading = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      onSelectionChange?.(rows.map((row) => row.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onSelectionChange?.(newSelected);
  };

  const handleSort = (columnId) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    onSort?.(columnId, isAsc ? 'desc' : 'asc');
  };

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActiveRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveRow(null);
  };

  const handleAction = (action) => {
    if (activeRow) {
      action.onClick(activeRow);
    }
    handleMenuClose();
  };

  const isAllSelected = rows.length > 0 && selectedIds.length === rows.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < rows.length;

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 'bold', ...column.headerSx }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right" sx={{ width: 60 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                  align="center"
                >
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isSelected}
                    onClick={() => selectable && handleSelectRow(row.id)}
                    sx={{ cursor: selectable ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.render ? column.render(row) : row[column.id]}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, row)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
          </Typography>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => onPageChange?.(page)}
            color="primary"
          />
        </Stack>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {activeRow && actions.map((action, index) => {
          // Support dynamic label, icon, and color (can be functions)
          const label = typeof action.label === 'function' ? action.label(activeRow) : action.label;
          const icon = typeof action.icon === 'function' ? action.icon(activeRow) : action.icon;
          const color = typeof action.color === 'function' ? action.color(activeRow) : action.color;
          
          return (
            <MenuItem
              key={index}
              onClick={() => handleAction(action)}
              disabled={action.disabled?.(activeRow)}
              sx={color ? { color: `${color}.main` } : {}}
            >
              {icon && <Box sx={{ mr: 1, display: 'flex' }}>{icon}</Box>}
              {label}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
