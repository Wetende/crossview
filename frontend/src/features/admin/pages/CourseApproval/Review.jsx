import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  IconArrowLeft,
  IconCheck,
  IconAlertTriangle,
  IconEye,
  IconBook,
  IconFolder,
  IconFile,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const NODE_ICONS = {
  module: IconFolder,
  session: IconBook,
  lesson: IconFile,
};

export default function Review({ program, curriculum, changeRequests }) {
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedNode, setSelectedNode] = useState('');

  const handleApprove = () => {
    if (confirm(`Approve "${program.name}"? This will allow the instructor to publish it.`)) {
      router.post(`/admin/course-approval/${program.id}/approve/`);
    }
  };

  const handleRequestChanges = () => {
    if (!feedback.trim()) return;

    router.post(
      `/admin/course-approval/${program.id}/request-changes/`,
      {
        message: feedback,
        nodeId: selectedNode || null,
      },
      {
        onSuccess: () => {
          setFeedbackDialog(false);
          setFeedback('');
          setSelectedNode('');
        },
      }
    );
  };

  return (
    <>
      <Head title={`Review: ${program.name}`} />
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
              href="/admin/course-approval/"
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">{program.name}</Typography>
              <Typography color="text.secondary">
                Submitted by {program.submittedBy?.name} on{' '}
                {program.submittedAt ? new Date(program.submittedAt).toLocaleDateString() : '—'}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} md={8}>
              {/* Description */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Program Description
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                  {program.description}
                </Typography>
              </Paper>

              {/* Curriculum Structure */}
              <Paper sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Curriculum Structure</Typography>
                  <Button
                    component={Link}
                    href={`/admin/course-approval/${program.id}/preview/`}
                    startIcon={<IconEye />}
                    size="small"
                  >
                    Preview as Student
                  </Button>
                </Stack>
                <List>
                  {curriculum.map((node) => {
                    const NodeIcon = NODE_ICONS[node.nodeType] || IconFile;
                    return (
                      <ListItem
                        key={node.id}
                        sx={{ pl: node.depth * 3 }}
                      >
                        <ListItemIcon>
                          <NodeIcon size={18} />
                        </ListItemIcon>
                        <ListItemText
                          primary={node.title}
                          secondary={node.nodeType}
                        />
                      </ListItem>
                    );
                  })}
                  {curriculum.length === 0 && (
                    <Alert severity="warning">
                      No curriculum content has been added yet.
                    </Alert>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Actions */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review Actions
                  </Typography>
                  <Stack spacing={2}>
                    {program.status === 'submitted' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<IconCheck />}
                          onClick={handleApprove}
                          fullWidth
                        >
                          Approve Program
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<IconAlertTriangle />}
                          onClick={() => setFeedbackDialog(true)}
                          fullWidth
                        >
                          Request Changes
                        </Button>
                      </>
                    )}
                    {program.status === 'approved' && (
                      <Chip
                        icon={<IconCheck size={14} />}
                        label="Already Approved"
                        color="success"
                      />
                    )}
                    {program.status === 'changes_requested' && (
                      <Alert severity="warning">
                        Awaiting instructor revisions
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Change Requests */}
              {changeRequests.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Change Requests ({changeRequests.length})
                    </Typography>
                    <Stack spacing={2}>
                      {changeRequests.map((cr) => (
                        <Box
                          key={cr.id}
                          sx={{
                            p: 1.5,
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight="medium">
                            {cr.nodeTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {cr.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cr.createdBy} • {new Date(cr.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </motion.div>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Changes</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Related Section (optional)</InputLabel>
                <Select
                  value={selectedNode}
                  label="Related Section (optional)"
                  onChange={(e) => setSelectedNode(e.target.value)}
                >
                  <MenuItem value="">General Feedback</MenuItem>
                  {curriculum.map((node) => (
                    <MenuItem key={node.id} value={node.id}>
                      {node.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Feedback for Instructor"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Describe what needs to be changed..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRequestChanges}
              variant="contained"
              color="warning"
              disabled={!feedback.trim()}
            >
              Send Feedback
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
