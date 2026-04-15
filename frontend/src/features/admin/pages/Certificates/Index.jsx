/**
 * Admin Certificates Management Page
 * View and manage all issued certificates
 */

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BlockIcon from '@mui/icons-material/Block';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';

import DashboardLayout from '@/layouts/DashboardLayout';

function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
          }}
        >
          <Icon />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function CertificatesIndex({ certificates = [], stats = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [processingEligibilityId, setProcessingEligibilityId] = useState(null);
  const [refreshingQueue, setRefreshingQueue] = useState(false);

  // Filter certificates based on search query
  const filteredCertificates = certificates.filter(cert => {
    const query = searchQuery.toLowerCase();
    return (
      cert.studentName?.toLowerCase().includes(query) ||
      cert.programTitle?.toLowerCase().includes(query) ||
      cert.serialNumber?.toLowerCase().includes(query) ||
      cert.studentEmail?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRefreshQueue = () => {
    setRefreshingQueue(true);
    router.post('/admin/certificates/refresh/', {}, {
      preserveScroll: true,
      onFinish: () => setRefreshingQueue(false),
    });
  };

  const handleRelease = (eligibilityId) => {
    if (!eligibilityId) {
      return;
    }
    setProcessingEligibilityId(eligibilityId);
    router.post(`/admin/certificates/release/${eligibilityId}/`, {}, {
      preserveScroll: true,
      onFinish: () => setProcessingEligibilityId(null),
    });
  };

  const queueStatusLabel = (status) => {
    if (status === 'pending') return 'Pending Release';
    if (status === 'released') return 'Released';
    if (status === 'ineligible') return 'Ineligible';
    return 'Unknown';
  };

  return (
    <DashboardLayout role="admin">
      <Head title="Certificates Management" />
      
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Certificates Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage certificate eligibility and admin releases
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshQueue}
            disabled={refreshingQueue}
          >
            {refreshingQueue ? 'Refreshing...' : 'Refresh Eligibility Queue'}
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatCard
                title="Total Certificates"
                value={stats.total || 0}
                icon={CardMembershipIcon}
                color="primary"
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatCard
                title="Issued This Month"
                value={stats.thisMonth || 0}
                icon={TrendingUpIcon}
                color="success"
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatCard
                title="Revoked"
                value={stats.revoked || 0}
                icon={BlockIcon}
                color="error"
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StatCard
                title="Pending Queue"
                value={stats.pendingQueue || 0}
                icon={HourglassEmptyIcon}
                color="warning"
              />
            </motion.div>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by student name, program, or serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Certificates Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Program</TableCell>
                  <TableCell>Issued Date</TableCell>
                  <TableCell>Queue Status</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {certificates.length === 0 
                          ? 'No certificates have been issued yet.'
                          : 'No certificates match your search.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => (
                    <TableRow key={cert.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {cert.serialNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{cert.studentName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cert.studentEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>{cert.programTitle}</TableCell>
                      <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={queueStatusLabel(cert.queueStatus)}
                          size="small"
                          color={
                            cert.queueStatus === 'pending'
                              ? 'warning'
                              : cert.queueStatus === 'released'
                              ? 'success'
                              : 'default'
                          }
                          variant={
                            cert.queueStatus === 'ineligible'
                              ? 'outlined'
                              : 'filled'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {cert.isRevoked ? (
                          <Chip 
                            label="Revoked" 
                            size="small" 
                            color="error"
                            icon={<BlockIcon />}
                          />
                        ) : (
                          <Chip 
                            label="Valid" 
                            size="small" 
                            color="success"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {cert.canRelease && (
                            <Tooltip title="Release Certificate">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleRelease(cert.eligibilityId)}
                                  disabled={
                                    processingEligibilityId === cert.eligibilityId
                                  }
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {cert.serialNumber && cert.queueStatus === 'released' && (
                            <Tooltip title="View Certificate">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/verify/${cert.serialNumber}/`}
                                target="_blank"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
