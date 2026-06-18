import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { tokens } from './programRecordTokens';

export const Eyebrow = styled(Typography)({
  fontFamily: tokens.fontMono,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tokens.muted,
});

export const PageTitle = styled(Typography)({
  fontFamily: tokens.fontDisplay,
  fontWeight: 600,
  fontSize: 'clamp(28px, 4vw, 40px)',
  letterSpacing: '-0.01em',
  color: tokens.ink,
  maxWidth: '80%',
});

export const StatusStamp = styled(Box)(({ statuscolor }) => ({
  position: 'absolute',
  top: 32,
  right: 40,
  width: 92,
  height: 92,
  borderRadius: '50%',
  border: `2px dashed ${statuscolor}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: statuscolor,
  transform: 'rotate(-8deg)',
  cursor: 'pointer', // Since we're adding onClick
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'rotate(-4deg) scale(1.05)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 7,
    border: `1px solid ${statuscolor}`,
    borderRadius: '50%',
  },
  '@media (max-width: 760px)': {
    position: 'static',
    marginTop: '24px',
    marginBottom: '16px',
    alignSelf: 'flex-start',
  }
}));


