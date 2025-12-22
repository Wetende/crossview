import { Head, Link } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function TiersIndex({ tiers }) {
  return (
    <DashboardLayout role="superadmin">
      <Head title="Subscription Tiers" />

      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Subscription Tiers</Typography>
          <Link href="/superadmin/tiers/create/">
            <Button variant="contained" startIcon={<AddIcon />}>Add Tier</Button>
          </Link>
        </Stack>

        <Grid container spacing={3}>
          {tiers?.map((tier, index) => (
            <Grid item xs={12} sm={6} md={4} key={tier.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">{tier.name}</Typography>
                        <Chip
                          label={tier.isActive ? 'Active' : 'Inactive'}
                          color={tier.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Code: {tier.code}
                      </Typography>

                      <Typography variant="h4" color="primary">
                        KES {tier.priceMonthly?.toLocaleString()}
                        <Typography component="span" variant="body2" color="text.secondary">/month</Typography>
                      </Typography>

                      <Box>
                        <Typography variant="body2">• {tier.maxStudents} Students</Typography>
                        <Typography variant="body2">• {tier.maxPrograms} Programs</Typography>
                        <Typography variant="body2">• {tier.maxStorageMb} MB Storage</Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {tier.tenantCount} tenant{tier.tenantCount !== 1 ? 's' : ''} using this tier
                      </Typography>

                      <Link href={`/superadmin/tiers/${tier.id}/edit/`}>
                        <Button fullWidth variant="outlined">Edit Tier</Button>
                      </Link>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
