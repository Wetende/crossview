import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";

import CertificateCanvas from "@/features/certifications/components/CertificateCanvas";
import DashboardLayout from "@/layouts/DashboardLayout";

function TemplateCard({ template, starter, onUse }) {
    return (
        <Paper
            elevation={0}
            sx={{
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                transition: "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 18px 42px rgba(25, 37, 61, 0.12)",
                },
            }}
        >
            <Box
                sx={{
                    p: 2.5,
                    bgcolor: "#eef1f7",
                    minHeight: 220,
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <CertificateCanvas
                    layout={template.layout}
                    widthMm={template.widthMm}
                    heightMm={template.heightMm}
                    sx={{
                        width:
                            template.orientation === "portrait" ? "52%" : "100%",
                        maxHeight: 184,
                    }}
                />
            </Box>
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700} noWrap>
                            {template.name}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                minHeight: 40,
                            }}
                        >
                            {template.description || "Editable certificate design"}
                        </Typography>
                    </Box>
                    <Chip
                        size="small"
                        label={starter ? "Starter" : template.status}
                        color={template.status === "published" ? "success" : "default"}
                        variant={starter ? "filled" : "outlined"}
                    />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: "capitalize" }}
                    >
                        {template.orientation} · A4
                        {!starter &&
                            ` · Updated ${new Date(template.updatedAt).toLocaleDateString()}`}
                    </Typography>
                    {starter ? (
                        <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => onUse(template)}
                        >
                            Use template
                        </Button>
                    ) : (
                        <Button
                            component={Link}
                            href={`/admin/certificate-templates/${template.id}/builder/`}
                            variant="outlined"
                            endIcon={<ArrowForwardIcon />}
                        >
                            Edit
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}

export default function CertificateTemplatesIndex({
    starters = [],
    templates = [],
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const [cloneSource, setCloneSource] = useState(null);
    const [name, setName] = useState("");
    const [orientation, setOrientation] = useState("landscape");
    const [processing, setProcessing] = useState(false);
    const defaultName = useMemo(
        () => (cloneSource ? `${cloneSource.name} copy` : "Untitled certificate"),
        [cloneSource],
    );

    const closeDialog = () => {
        if (processing) return;
        setCreateOpen(false);
        setCloneSource(null);
        setName("");
        setOrientation("landscape");
    };

    const submit = () => {
        setProcessing(true);
        const selectedName = name.trim() || defaultName;
        const url = cloneSource
            ? `/admin/certificate-templates/${cloneSource.id}/clone/`
            : "/admin/certificate-templates/create/";
        router.post(
            url,
            cloneSource
                ? { name: selectedName }
                : { name: selectedName, orientation },
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[
                { label: "Management" },
                { label: "Certificate templates" },
            ]}
        >
            <Head title="Certificate templates" />

            <Stack spacing={5}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "stretch", md: "flex-end" },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 1 }}
                        >
                            <AutoAwesomeIcon color="primary" fontSize="small" />
                            <Typography
                                variant="overline"
                                color="primary.main"
                                fontWeight={700}
                            >
                                Visual certificate studio
                            </Typography>
                        </Stack>
                        <Typography variant="h3" component="h1" fontWeight={750}>
                            Start with a design. Make it yours.
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mt: 1, maxWidth: 700 }}
                        >
                            Choose a ready-made certificate or begin with a blank
                            page. Every copy can be edited visually and published
                            without changing application code.
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <Button
                            component={Link}
                            href="/admin/certificates/"
                            startIcon={<CardMembershipIcon />}
                            color="inherit"
                        >
                            Issued certificates
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateOpen(true)}
                        >
                            Create blank
                        </Button>
                    </Stack>
                </Box>

                <Box component="section">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <DashboardCustomizeIcon color="primary" />
                        <Box>
                            <Typography variant="h5" fontWeight={700}>
                                Starter templates
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Using a starter creates your own editable copy.
                            </Typography>
                        </Box>
                    </Stack>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                xl: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: 3,
                        }}
                    >
                        {starters.map((template) => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                starter
                                onUse={(selected) => {
                                    setCloneSource(selected);
                                    setName(`${selected.name} copy`);
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Box component="section">
                    <Typography variant="h5" fontWeight={700}>
                        Your certificates
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                        Drafts and published designs created by your team.
                    </Typography>
                    {templates.length ? (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    sm: "repeat(2, minmax(0, 1fr))",
                                    xl: "repeat(3, minmax(0, 1fr))",
                                },
                                gap: 3,
                            }}
                        >
                            {templates.map((template) => (
                                <TemplateCard key={template.id} template={template} />
                            ))}
                        </Box>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 5,
                                textAlign: "center",
                                borderStyle: "dashed",
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="h6">No custom certificates yet</Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                                Pick a starter above or create a blank canvas.
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => setCreateOpen(true)}
                            >
                                Create blank
                            </Button>
                        </Paper>
                    )}
                </Box>
            </Stack>

            <Dialog
                open={createOpen || Boolean(cloneSource)}
                onClose={closeDialog}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>
                    {cloneSource ? `Use ${cloneSource.name}` : "Create blank certificate"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <TextField
                            autoFocus
                            label="Template name"
                            value={name}
                            placeholder={defaultName}
                            onChange={(event) => setName(event.target.value)}
                            fullWidth
                        />
                        {!cloneSource && (
                            <FormControl fullWidth>
                                <InputLabel>Orientation</InputLabel>
                                <Select
                                    label="Orientation"
                                    value={orientation}
                                    onChange={(event) => setOrientation(event.target.value)}
                                >
                                    <MenuItem value="landscape">Landscape</MenuItem>
                                    <MenuItem value="portrait">Portrait</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                        <Typography variant="body2" color="text.secondary">
                            {cloneSource
                                ? "We will create an independent draft. The starter remains unchanged."
                                : "You can add text, learner details, shapes, signatures and verification elements in the builder."}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} disabled={processing}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={submit} disabled={processing}>
                        {processing ? "Creating…" : "Open builder"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
