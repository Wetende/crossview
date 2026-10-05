import Button from '@mui/material/Button';
import PrintIcon from '@mui/icons-material/Print';

export default function PrintButton({ href, onClick, disabled = false, label = 'Print' }) {
  if (href) {
    return (
      <Button
        component="a"
        href={href}
        target="_blank"
        rel="noreferrer"
        variant="contained"
        startIcon={<PrintIcon />}
        disabled={disabled}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      startIcon={<PrintIcon />}
      onClick={onClick || (() => window.print())}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}

