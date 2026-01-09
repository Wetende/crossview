import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import {
  IconPlus,
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconClock,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { router } from '@inertiajs/react';

export default function Index({ node, quizzes }) {
  const handleDelete = (quizId) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      router.post(`/instructor/quizzes/${quizId}/delete/`);
    }
  };

  return (
    <>
      <Head title={`Quizzes: ${node.title}`} />
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
              href="/instructor/content/"
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back to Content
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">Quizzes</Typography>
              <Typography color="text.secondary">
                {node.programName} / {node.title}
              </Typography>
            </Box>
            <Button
              component={Link}
              href={`/instructor/lesson/${node.id}/quizzes/create/`}
              startIcon={<IconPlus />}
              variant="contained"
            >
              Create Quiz
            </Button>
          </Stack>

          {/* Quizzes Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quiz Title</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Time Limit</TableCell>
                  <TableCell>Pass %</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quizzes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No quizzes yet. Create one to test student knowledge.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quizzes.map((quiz) => (
                    <TableRow key={quiz.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{quiz.title}</Typography>
                      </TableCell>
                      <TableCell>{quiz.questionCount}</TableCell>
                      <TableCell>
                        {quiz.timeLimit ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconClock size={14} />
                            <span>{quiz.timeLimit} min</span>
                          </Stack>
                        ) : (
                          'No limit'
                        )}
                      </TableCell>
                      <TableCell>{quiz.passThreshold}%</TableCell>
                      <TableCell>
                        <Chip
                          label={quiz.isPublished ? 'Published' : 'Draft'}
                          color={quiz.isPublished ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            component={Link}
                            href={`/instructor/quizzes/${quiz.id}/edit/`}
                            size="small"
                            startIcon={<IconEdit size={16} />}
                          >
                            Edit
                          </Button>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDelete(quiz.id)}
                          >
                            <IconTrash size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Container>
    </>
  );
}
