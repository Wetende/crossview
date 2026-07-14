import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardLayout from '@/layouts/DashboardLayout';

export default function ReportsIndex({ scope = 'admin', reports = [] }) {
  return (
    <DashboardLayout role={scope}>
      <Head title="Reports" />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Reports
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {reports.map((report) => (
              <Paper
                key={report.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 1 }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <AssessmentIcon color="primary" />
                    <Box>
                      <Typography fontWeight={700}>{report.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.description}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    component={Link}
                    href={`/${scope}/reports/${report.id}/print/`}
                    variant="contained"
                  >
                    Open
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
