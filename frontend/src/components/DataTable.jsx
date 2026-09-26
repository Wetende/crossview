/**
 * DataTable Component
 * Premium reusable table with sorting, pagination, and row actions.
 * Modern design with refined spacing, subtle row styling, and polished interactions.
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
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

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
  const theme = useTheme();
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

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.08)
                  : alpha(theme.palette.primary.main, 0.04),
              }}
            >
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  }}
                >
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    py: 1.5,
                    px: 2,
                    whiteSpace: 'nowrap',
                    ...column.headerSx,
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(column.id)}
                      sx={{
                        '&.Mui-active': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell
                  align="right"
                  sx={{
                    width: 56,
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    py: 1.5,
                    px: 2,
                  }}
                />
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (actions.length > 0 ? 1 : 0)
                  }
                  align="center"
                >
                  <Box sx={{ py: 6 }}>
                    <Typography
                      color="textSecondary"
                      sx={{ fontSize: '0.9rem' }}
                    >
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isSelected}
                    onClick={() => selectable && handleSelectRow(row.id)}
                    sx={{
                      cursor: selectable ? 'pointer' : 'default',
                      bgcolor:
                        rowIndex % 2 === 1
                          ? isDark
                            ? alpha(theme.palette.background.paper, 0.4)
                            : alpha(theme.palette.grey[50], 0.7)
                          : 'transparent',
                      '&:hover': {
                        bgcolor: isDark
                          ? alpha(theme.palette.primary.main, 0.06)
                          : alpha(theme.palette.primary.main, 0.03),
                      },
                      '&:last-child td': {
                        borderBottom: 0,
                      },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} size="small" />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderColor: 'divider',
                          fontSize: '0.875rem',
                          ...column.cellSx,
                        }}
                      >
                        {column.render ? column.render(row) : row[column.id]}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell
                        align="right"
                        sx={{
                          py: 1,
                          px: 1.5,
                          borderColor: 'divider',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, row)}
                          sx={{
                            color: 'text.secondary',
                            borderRadius: 1.5,
                            width: 32,
                            height: 32,
                            '&:hover': {
                              bgcolor: isDark
                                ? alpha(theme.palette.primary.main, 0.12)
                                : alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main',
                            },
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <MoreHorizIcon fontSize="small" />
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
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            px: 1,
          }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ fontSize: '0.8rem' }}
          >
            Showing{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {(pagination.page - 1) * pagination.perPage + 1}
            </Box>
            –
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {Math.min(
                pagination.page * pagination.perPage,
                pagination.total,
              )}
            </Box>{' '}
            of{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {pagination.total}
            </Box>
          </Typography>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => onPageChange?.(page)}
            color="primary"
            size="small"
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 500,
                fontSize: '0.8rem',
                minWidth: 32,
                height: 32,
              },
            }}
          />
        </Stack>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 180,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              mt: 0.5,
              py: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {activeRow &&
          actions.map((action, index) => {
            // Support dynamic label, icon, and color (can be functions)
            const label =
              typeof action.label === 'function'
                ? action.label(activeRow)
                : action.label;
            const icon =
              typeof action.icon === 'function'
                ? action.icon(activeRow)
                : action.icon;
            const color =
              typeof action.color === 'function'
                ? action.color(activeRow)
                : action.color;

            // Insert a divider before danger actions
            const showDivider =
              color === 'error' &&
              index > 0 &&
              (typeof actions[index - 1].color === 'function'
                ? actions[index - 1].color(activeRow)
                : actions[index - 1].color) !== 'error';

            return (
              <Box key={index}>
                {showDivider && <Divider sx={{ my: 0.5 }} />}
                <MenuItem
                  onClick={() => handleAction(action)}
                  disabled={action.disabled?.(activeRow)}
                  sx={{
                    py: 1,
                    px: 2,
                    fontSize: '0.85rem',
                    borderRadius: 1,
                    mx: 0.5,
                    ...(color
                      ? {
                          color: `${color}.main`,
                          '&:hover': {
                            bgcolor: alpha(
                              theme.palette[color]?.main ||
                                theme.palette.primary.main,
                              0.08,
                            ),
                          },
                        }
                      : {}),
                  }}
                >
                  {icon && (
                    <ListItemIcon
                      sx={{
                        minWidth: 28,
                        color: 'inherit',
                      }}
                    >
                      {icon}
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        sx: { fontSize: '0.85rem', fontWeight: 500 },
                      },
                    }}
                  />
                </MenuItem>
              </Box>
            );
          })}
      </Menu>
    </Box>
  );
}
