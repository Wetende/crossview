import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
} from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { motion } from 'framer-motion';

export default function Create({ node }) {
  const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
    timeLimit: '',
    maxAttempts: 1,
    passThreshold: 70,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/instructor/lesson/${node.id}/quizzes/create/`);
  };

  return (
    <>
      <Head title="Create Quiz" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Button
              component={Link}
              href={`/instructor/lesson/${node.id}/quizzes/`}
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Typography variant="h4">Create Quiz</Typography>
          </Stack>

          <Paper sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Typography color="text.secondary">
                  Creating quiz for: <strong>{node.programName}</strong> / {node.title}
                </Typography>

                <TextField
                  label="Quiz Title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  fullWidth
                  required
                  error={!!errors.title}
                  helperText={errors.title}
                />

                <TextField
                  label="Description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Optional description for students"
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Time Limit (minutes)"
                    type="number"
                    value={data.timeLimit}
                    onChange={(e) => setData('timeLimit', e.target.value)}
                    sx={{ width: 200 }}
                    placeholder="No limit"
                    helperText="Leave empty for no time limit"
                  />
                  <TextField
                    label="Max Attempts"
                    type="number"
                    value={data.maxAttempts}
                    onChange={(e) => setData('maxAttempts', parseInt(e.target.value))}
                    sx={{ width: 150 }}
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    label="Pass Threshold (%)"
                    type="number"
                    value={data.passThreshold}
                    onChange={(e) => setData('passThreshold', parseInt(e.target.value))}
                    sx={{ width: 150 }}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Stack>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={processing || !data.title}
                  >
                    {processing ? 'Creating...' : 'Create Quiz'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </>
  );
}
