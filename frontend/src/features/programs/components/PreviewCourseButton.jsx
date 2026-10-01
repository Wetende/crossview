import { Link } from "@inertiajs/react";
import { Button } from "@mui/material";
import { VisibilityOutlined } from "@mui/icons-material";

/** Secondary CTA that opens the course's first free preview lesson. */
export default function PreviewCourseButton({ href, sx }) {
    if (!href) return null;

    return (
        <Button
            component={Link}
            href={href}
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<VisibilityOutlined />}
            sx={{ py: 1.25, fontWeight: 700, ...sx }}
        >
            Preview this course
        </Button>
    );
}
