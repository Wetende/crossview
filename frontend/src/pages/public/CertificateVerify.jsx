/**
 * Public Certificate Verification Page
 * Requirements: 5.3, 6.1, 6.2, 6.3
 */

import { Head } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function ValidCertificate({ certificate }) {
  return (
    <Card sx={{ borderTop: '4px solid', borderColor: 'success.main' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <VerifiedIcon sx={{ fontSize: 64, color: 'success.main' }} />
          <Typography variant="h5" color="success.main" sx={{ mt: 1 }}>
            Certificate Verified
          </Typography>
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Certificate Holder
            </Typography>
            <Typography variant="h6">{certificate.studentName}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Program
            </Typography>
            <Typography variant="h6">{certificate.programTitle}</Typography>
          </Box>

          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Serial Number
              </Typography>
              <Typography variant="body1" fontFamily="monospace">
                {certificate.serialNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Completion Date
              </Typography>
              <Typography variant="body1">
                {new Date(certificate.completionDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Issue Date
              </Typography>
              <Typography variant="body1">
                {new Date(certificate.issueDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RevokedCertificate({ certificate }) {
  return (
    <Card sx={{ borderTop: '4px solid', borderColor: 'error.main' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <WarningIcon sx={{ fontSize: 64, color: 'error.main' }} />
          <Typography variant="h5" color="error.main" sx={{ mt: 1 }}>
            Certificate Revoked
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 3 }}>
          This certificate has been revoked and is no longer valid.
          {certificate.revocationReason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reason: {certificate.revocationReason}
            </Typography>
          )}
        </Alert>

        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Original Certificate Holder
            </Typography>
            <Typography variant="body1">{certificate.studentName}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Program
            </Typography>
            <Typography variant="body1">{certificate.programTitle}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Serial Number
            </Typography>
            <Typography variant="body1" fontFamily="monospace">
              {certificate.serialNumber}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function NotFoundCertificate({ serialNumber }) {
  return (
    <Card sx={{ borderTop: '4px solid', borderColor: 'grey.400' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'grey.400' }} />
          <Typography variant="h5" color="text.secondary" sx={{ mt: 1 }}>
            Certificate Not Found
          </Typography>
        </Box>

        <Alert severity="warning">
          No certificate was found with serial number: <strong>{serialNumber}</strong>
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Please verify the serial number and try again. If you believe this is an error,
          please contact the issuing institution.
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function CertificateVerify({ serialNumber, result, certificate }) {
  return (
    <>
      <Head title={`Verify Certificate - ${serialNumber}`} />

      <Container maxWidth="sm" sx={{ py: 6 }}>
        <motion.div {...fadeIn}>
          <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
            Certificate Verification
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Crossview Learning Management System
          </Typography>

          {result === 'valid' && <ValidCertificate certificate={certificate} />}
          {result === 'revoked' && <RevokedCertificate certificate={certificate} />}
          {result === 'not_found' && <NotFoundCertificate serialNumber={serialNumber} />}
        </motion.div>
      </Container>
    </>
  );
}
