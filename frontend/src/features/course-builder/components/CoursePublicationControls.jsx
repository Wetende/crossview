import { useState } from "react";
import { router } from "@inertiajs/react";
import {
    Button,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Launch as LaunchIcon,
    Publish as PublishIcon,
    Unpublished as UnpublishIcon,
} from "@mui/icons-material";
import ConfirmDialog from "@/components/ConfirmDialog";
import PublishValidationDialog from "./PublishValidationDialog";

export default function CoursePublicationControls({ program }) {
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [statusAnchor, setStatusAnchor] = useState(null);
    const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const viewUrl = program.isPublished
        ? program.publicUrl
        : `/instructor/programs/${program.id}/preview/`;

    const handlePublish = () => {
        router.post(
            `/instructor/programs/${program.id}/publish/`,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleUnpublish = () => {
        router.post(
            `/instructor/programs/${program.id}/unpublish/`,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onSuccess: () => setUnpublishDialogOpen(false),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            {program.isPublished ? (
                <>
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        endIcon={<ExpandMoreIcon />}
                        onClick={(event) => setStatusAnchor(event.currentTarget)}
                        aria-controls={statusAnchor ? "publication-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={statusAnchor ? "true" : undefined}
                    >
                        Published
                    </Button>
                    <Menu
                        id="publication-menu"
                        anchorEl={statusAnchor}
                        open={Boolean(statusAnchor)}
                        onClose={() => setStatusAnchor(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                        <MenuItem
                            onClick={() => {
                                setStatusAnchor(null);
                                setUnpublishDialogOpen(true);
                            }}
                        >
                            <ListItemIcon>
                                <UnpublishIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Unpublish</ListItemText>
                        </MenuItem>
                    </Menu>
                </>
            ) : (
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<PublishIcon />}
                    onClick={() => setPublishDialogOpen(true)}
                    disabled={processing}
                >
                    Publish
                </Button>
            )}

            <Button
                component="a"
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                endIcon={<LaunchIcon />}
                sx={{
                    color: "#f1f5f9",
                    borderColor: "rgba(255,255,255,0.35)",
                    "&:hover": {
                        borderColor: "#fff",
                        bgcolor: "rgba(255,255,255,0.08)",
                    },
                }}
            >
                View course
            </Button>

            <PublishValidationDialog
                open={publishDialogOpen}
                onClose={() => setPublishDialogOpen(false)}
                programId={program.id}
                onPublish={handlePublish}
            />
            <ConfirmDialog
                open={unpublishDialogOpen}
                onClose={() => setUnpublishDialogOpen(false)}
                onConfirm={handleUnpublish}
                title="Unpublish course?"
                message="Students will no longer find or access this course until you publish it again."
                confirmLabel="Unpublish"
                confirmColor="warning"
                loading={processing}
            />
        </>
    );
}
