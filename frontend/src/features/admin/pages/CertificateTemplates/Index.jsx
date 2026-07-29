import { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Box,
    Button,
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
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import CertificateCanvas from "@/features/certifications/components/CertificateCanvas";
import DashboardLayout from "@/layouts/DashboardLayout";

const currentTab = () =>
    typeof window === "undefined"
        ? "certificates"
        : new URLSearchParams(window.location.search).get("tab") === "link"
          ? "link"
          : "certificates";

function TemplateTile({
    template,
    selected = false,
    onClick,
    add = false,
    showName = true,
}) {
    return (
        <Box>
            <Paper
                component="button"
                type="button"
                onClick={onClick}
                aria-label={add ? "Create a blank certificate" : template.name}
                elevation={0}
                sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1.45 / 1",
                    p: add ? 0 : 1.25,
                    border: "2px solid",
                    borderColor: selected ? "primary.main" : "divider",
                    borderRadius: 2.5,
                    bgcolor: add ? "grey.50" : "#f3f5f9",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    transition: "border-color 140ms ease, transform 140ms ease",
                    "&:hover": {
                        borderColor: "primary.main",
                        transform: "translateY(-2px)",
                    },
                    "&:focus-visible": {
                        outline: "3px solid",
                        outlineColor: "primary.light",
                        outlineOffset: 2,
                    },
                }}
            >
                {add ? (
                    <AddIcon color="primary" sx={{ fontSize: 44 }} />
                ) : (
                    <CertificateCanvas
                        layout={template.layout}
                        widthMm={template.widthMm}
                        heightMm={template.heightMm}
                        sx={{
                            width:
                                template.orientation === "portrait" ? "49%" : "100%",
                            boxShadow: "0 8px 22px rgba(21,31,55,.12)",
                        }}
                    />
                )}
                {selected && (
                    <CheckCircleIcon
                        color="primary"
                        sx={{
                            position: "absolute",
                            right: 7,
                            bottom: 7,
                            bgcolor: "white",
                            borderRadius: "50%",
                        }}
                    />
                )}
            </Paper>
            {!add && showName && (
                <Typography
                    variant="body2"
                    fontWeight={650}
                    noWrap
                    sx={{ mt: 1, px: 0.25 }}
                >
                    {template.name}
                </Typography>
            )}
        </Box>
    );
}

function TemplatePicker({
    open,
    templates,
    initialVersionId,
    title = "Choose a template",
    onClose,
    onSave,
}) {
    const [selected, setSelected] = useState(initialVersionId || null);
    const save = () => {
        const template = templates.find(
            (item) => item.templateVersionId === selected,
        );
        if (template) onSave(template);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pb: 0.5 }}>{title}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Select one of the options to continue
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(2, minmax(0, 1fr))",
                            sm: "repeat(3, minmax(0, 1fr))",
                            md: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 2,
                    }}
                >
                    {templates.map((template) => (
                        <TemplateTile
                            key={template.templateVersionId}
                            template={template}
                            selected={selected === template.templateVersionId}
                            onClick={() => setSelected(template.templateVersionId)}
                            showName={false}
                        />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={!selected} onClick={save}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function AssignmentRow({ title, subtitle, assignment, onChoose }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                borderRadius: 2.5,
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={700}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                    {assignment?.templateName || subtitle}
                </Typography>
            </Box>
            <Button variant="outlined" onClick={onChoose}>
                {assignment?.templateName ? "Change" : "Choose"}
            </Button>
        </Paper>
    );
}

function LinkingPanel({
    publishedTemplates,
    assignments,
    categories,
    programs,
}) {
    const [picker, setPicker] = useState(null);
    const defaultAssignment = assignments.find((item) => item.scope === "default");
    const assignmentForCategory = (category) =>
        assignments.find(
            (item) => item.scope === "category" && item.category === category,
        );
    const assignmentForProgram = (programId) =>
        assignments.find(
            (item) => item.scope === "course" && item.programId === programId,
        );

    const choose = (scope, target, assignment) =>
        setPicker({
            scope,
            target,
            assignment,
        });

    const save = (template) => {
        const payload = {
            scope: picker.scope,
            templateVersionId: template.templateVersionId,
            issueEnabled: true,
        };
        if (picker.scope === "category") payload.category = picker.target;
        if (picker.scope === "course") payload.programId = picker.target;
        router.post("/admin/certificate-templates/link/", payload, {
            preserveScroll: true,
            onSuccess: () => setPicker(null),
        });
    };

    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant="h5" fontWeight={750} sx={{ mb: 1.5 }}>
                    Default certificate
                </Typography>
                <AssignmentRow
                    title="All courses"
                    subtitle="No default certificate selected"
                    assignment={defaultAssignment}
                    onChoose={() => choose("default", null, defaultAssignment)}
                />
            </Box>

            <Box>
                <Typography variant="h5" fontWeight={750} sx={{ mb: 1.5 }}>
                    Course categories
                </Typography>
                <Stack spacing={1}>
                    {categories.map((category) => {
                        const assignment = assignmentForCategory(category);
                        return (
                            <AssignmentRow
                                key={category}
                                title={category}
                                subtitle="Uses the default certificate"
                                assignment={assignment}
                                onChoose={() =>
                                    choose("category", category, assignment)
                                }
                            />
                        );
                    })}
                    {!categories.length && (
                        <Typography color="text.secondary">
                            Add course categories in platform settings first.
                        </Typography>
                    )}
                </Stack>
            </Box>

            <Box>
                <Typography variant="h5" fontWeight={750} sx={{ mb: 1.5 }}>
                    Courses
                </Typography>
                <Stack spacing={1}>
                    {programs.map((program) => {
                        const assignment = assignmentForProgram(program.id);
                        return (
                            <AssignmentRow
                                key={program.id}
                                title={program.name}
                                subtitle={
                                    program.category
                                        ? `Uses ${program.category} or default`
                                        : "Uses the default certificate"
                                }
                                assignment={assignment}
                                onChoose={() =>
                                    choose("course", program.id, assignment)
                                }
                            />
                        );
                    })}
                </Stack>
            </Box>

            {picker && (
                <TemplatePicker
                    key={`${picker.scope}-${picker.target || "default"}`}
                    open
                    templates={publishedTemplates}
                    initialVersionId={picker.assignment?.templateVersionId}
                    onClose={() => setPicker(null)}
                    onSave={save}
                />
            )}
        </Stack>
    );
}

export default function CertificateTemplatesIndex({
    starters = [],
    templates = [],
    publishedTemplates = [],
    assignments = [],
    categories = [],
    programs = [],
}) {
    const [tab, setTab] = useState(currentTab);
    const [createOpen, setCreateOpen] = useState(false);
    const [name, setName] = useState("Untitled certificate");
    const [orientation, setOrientation] = useState("landscape");
    const [processing, setProcessing] = useState(false);
    const allTemplates = useMemo(
        () => [...templates, ...starters],
        [starters, templates],
    );

    const openTemplate = (template) => {
        if (!template.isStarter) {
            router.visit(
                `/admin/certificate-templates/${template.id}/builder/`,
            );
            return;
        }
        setProcessing(true);
        router.post(
            `/admin/certificate-templates/${template.id}/clone/`,
            { name: `${template.name} copy` },
            { onFinish: () => setProcessing(false) },
        );
    };

    const createBlank = () => {
        setProcessing(true);
        router.post(
            "/admin/certificate-templates/create/",
            { name: name.trim() || "Untitled certificate", orientation },
            { onFinish: () => setProcessing(false) },
        );
    };

    const switchTab = (_, nextTab) => {
        setTab(nextTab);
        const url =
            nextTab === "link"
                ? "/admin/certificate-templates/?tab=link"
                : "/admin/certificate-templates/";
        window.history.replaceState({}, "", url);
    };

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[{ label: "Management" }, { label: "Certificates" }]}
        >
            <Head title="Certificates" />
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    gap={2}
                >
                    <Typography variant="h3" component="h1" fontWeight={760}>
                        Certificates
                    </Typography>
                    <Button
                        component={Link}
                        href="/admin/certificates/"
                        startIcon={<CardMembershipIcon />}
                        color="inherit"
                    >
                        Issued certificates
                    </Button>
                </Stack>

                <Tabs value={tab} onChange={switchTab}>
                    <Tab value="certificates" label="Certificates" />
                    <Tab value="link" label="Link certificates" />
                </Tabs>

                {tab === "certificates" ? (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "repeat(2, minmax(0, 1fr))",
                                sm: "repeat(3, minmax(0, 1fr))",
                                lg: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: { xs: 2, md: 2.5 },
                        }}
                    >
                        <TemplateTile add onClick={() => setCreateOpen(true)} />
                        {allTemplates.map((template) => (
                            <TemplateTile
                                key={template.id}
                                template={template}
                                onClick={() => !processing && openTemplate(template)}
                            />
                        ))}
                    </Box>
                ) : (
                    <LinkingPanel
                        publishedTemplates={publishedTemplates}
                        assignments={assignments}
                        categories={categories}
                        programs={programs}
                    />
                )}
            </Stack>

            <Dialog
                open={createOpen}
                onClose={() => !processing && setCreateOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Create a blank certificate</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        <TextField
                            autoFocus
                            label="Certificate name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            fullWidth
                        />
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
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setCreateOpen(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createBlank}
                        disabled={processing || !name.trim()}
                    >
                        {processing ? "Opening…" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
