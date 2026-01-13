import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconSend,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

export default function ChangeRequests({ program, changeRequests }) {
  const unresolvedCount = changeRequests.filter((cr) => !cr.isResolved).length;
  const canResubmit = program.status === 'changes_requested' && unresolvedCount === 0;

  const handleResolve = (changeRequestId) => {
    router.post(`/instructor/change-requests/${changeRequestId}/resolve/`);
  };

  const handleResubmit = () => {
    router.post(`/instructor/programs/${program.id}/submit/`);
  };

  return (
    <>
      <Head title={`Change Requests: ${program.name}`} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Button
              component={Link}
              href={`/instructor/programs/${program.id}/`}
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">Change Requests</Typography>
              <Typography color="text.secondary">{program.name}</Typography>
            </Box>
            {canResubmit && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<IconSend />}
                onClick={handleResubmit}
              >
                Resubmit for Review
              </Button>
            )}
          </Stack>

          {/* Status Alert */}
          {program.status === 'changes_requested' && unresolvedCount > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              You have {unresolvedCount} unresolved change request
              {unresolvedCount > 1 ? 's' : ''}. Address them and mark as resolved to
              resubmit.
            </Alert>
          )}

          {changeRequests.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No change requests for this program
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {changeRequests.map((cr) => (
                <Card
                  key={cr.id}
                  variant={cr.isResolved ? 'outlined' : 'elevation'}
                  sx={{
                    opacity: cr.isResolved ? 0.7 : 1,
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={cr.nodeTitle}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {cr.isResolved ? (
                            <Chip
                              icon={<IconCheck size={14} />}
                              label="Resolved"
                              size="small"
                              color="success"
                            />
                          ) : (
                            <Chip
                              icon={<IconClock size={14} />}
                              label="Pending"
                              size="small"
                              color="warning"
                            />
                          )}
                        </Stack>
                        <Typography sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                          {cr.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(cr.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      {!cr.isResolved && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<IconCheck size={14} />}
                          onClick={() => handleResolve(cr.id)}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </motion.div>
      </Container>
    </>
  );
}
