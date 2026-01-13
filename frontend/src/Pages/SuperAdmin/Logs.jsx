import { Head, router } from '@inertiajs/react';
import { Box, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';

const levelColors = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  debug: 'default',
};

export default function SystemLogs({ logs, filters, pagination }) {
  const [level, setLevel] = useState(filters?.level || '');

  const handleFilter = (newLevel) => {
    setLevel(newLevel);
    router.visit('/superadmin/logs/', {
      data: { level: newLevel },
      preserveState: true,
    });
  };

  return (
    <DashboardLayout role="superadmin">
      <Head title="System Logs" />

      <Stack spacing={3}>
        <Typography variant="h4">System Logs</Typography>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Level</InputLabel>
                  <Select value={level} label="Level" onChange={(e) => handleFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Level</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Chip
                          label={log.level}
                          color={levelColors[log.level] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No logs found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
