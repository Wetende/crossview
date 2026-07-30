import { useMemo, useState } from "react";
import {
    Box,
    Button,
    ButtonBase,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import {
    CardMembershipOutlined as CertificateIcon,
    CheckCircle as SelectedIcon,
    Close as CloseIcon,
    VisibilityOutlined as PreviewIcon,
} from "@mui/icons-material";

import CertificateCanvas from "./CertificateCanvas";

const normalizedId = (value) => String(value ?? "");

const inheritedSourceLabel = (source) => {
    if (source === "category") {
        return "Inherited from category";
    }
    if (source === "default" || source === "legacy-default") {
        return "Inherited from system";
    }
    if (source === "course") {
        return "Current course certificate";
    }
    return "Uses the linked system certificate";
};

const CertificateThumbnail = ({ template }) => (
    <Box
        sx={{
            width: "100%",
            height: 118,
            display: "grid",
            placeItems: "center",
            px: 1.5,
            py: 1.25,
            bgcolor: "#eef1f7",
            pointerEvents: "none",
        }}
    >
        {template ? (
            <CertificateCanvas
                layout={template.layout}
                widthMm={template.widthMm}
                heightMm={template.heightMm}
                sx={{
                    width:
                        template.orientation === "portrait" ? "42%" : "100%",
                    maxHeight: 96,
                    boxShadow: "0 4px 14px rgba(21, 31, 55, 0.14)",
                }}
            />
        ) : (
            <Stack spacing={0.75} alignItems="center" color="text.disabled">
                <CertificateIcon sx={{ fontSize: 34 }} />
                <Typography variant="caption" color="inherit">
                    Linked outside this course
                </Typography>
            </Stack>
        )}
    </Box>
);

const CertificateTile = ({
    title,
    subtitle,
    template,
    selected,
    disabled,
    onSelect,
    onPreview,
    selectionLabel,
    previewLabel,
}) => (
    <Paper
        variant="outlined"
        sx={{
            position: "relative",
            overflow: "hidden",
            borderWidth: 2,
            borderColor: selected ? "primary.main" : "divider",
            bgcolor: selected ? "primary.50" : "background.paper",
            boxShadow: selected
                ? "0 0 0 3px rgba(49, 87, 213, 0.11)"
                : "0 8px 22px rgba(21, 31, 55, 0.07)",
            opacity: disabled ? 0.58 : 1,
            transition:
                "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
            "&:hover": disabled
                ? {}
                : {
                      borderColor: selected ? "primary.main" : "primary.light",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 28px rgba(21, 31, 55, 0.12)",
                  },
        }}
    >
        <ButtonBase
            disabled={disabled}
            aria-label={selectionLabel}
            aria-pressed={selected}
            onClick={onSelect}
            sx={{
                width: "100%",
                display: "block",
                textAlign: "left",
                "&.Mui-focusVisible": {
                    outline: "3px solid",
                    outlineColor: "primary.light",
                    outlineOffset: -3,
                },
            }}
        >
            <CertificateThumbnail template={template} />
            <Box sx={{ px: 1.5, py: 1.25, minHeight: 66 }}>
                <Typography
                    variant="body2"
                    fontWeight={750}
                    noWrap
                    title={title}
                >
                    {title}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.25 }}
                >
                    {subtitle}
                </Typography>
            </Box>
        </ButtonBase>

        {selected && (
            <SelectedIcon
                color="primary"
                aria-hidden="true"
                sx={{
                    position: "absolute",
                    zIndex: 1,
                    top: 8,
                    left: 8,
                    bgcolor: "background.paper",
                    borderRadius: "50%",
                    boxShadow: 1,
                }}
            />
        )}

        {template && (
            <Button
                size="small"
                variant="contained"
                color="inherit"
                startIcon={<PreviewIcon />}
                disabled={disabled}
                aria-label={previewLabel}
                onClick={onPreview}
                sx={{
                    position: "absolute",
                    zIndex: 1,
                    top: 8,
                    right: 8,
                    minWidth: 0,
                    px: 1,
                    py: 0.4,
                    bgcolor: "rgba(255, 255, 255, 0.94)",
                    color: "text.primary",
                    boxShadow: 1,
                    "&:hover": {
                        bgcolor: "background.paper",
                    },
                }}
            >
                Preview
            </Button>
        )}
    </Paper>
);

const CertificateTemplateSelector = ({
    templates = [],
    value = "",
    defaultTemplateVersionId = null,
    defaultTemplateName = "",
    defaultSource = "",
    disabled = false,
    onChange,
}) => {
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const selectedId = normalizedId(value);
    const defaultTemplate = useMemo(
        () =>
            templates.find(
                (template) =>
                    normalizedId(template.templateVersionId) ===
                    normalizedId(defaultTemplateVersionId),
            ) || null,
        [defaultTemplateVersionId, templates],
    );

    const openPreview = (template, title) => {
        setPreviewTemplate({ ...template, previewTitle: title });
    };

    return (
        <>
            <Stack spacing={1.5}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={750}>
                        Choose a certificate design
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Select a thumbnail for this course. Previewing a design
                        does not change your selection.
                    </Typography>
                </Box>

                <Box
                    role="group"
                    aria-label="Certificate designs"
                    sx={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(158px, 1fr))",
                        gap: 1.5,
                    }}
                >
                    <CertificateTile
                        title="Default by system"
                        subtitle={
                            defaultTemplateName
                                ? inheritedSourceLabel(defaultSource)
                                : "Uses the linked system certificate"
                        }
                        template={defaultTemplate}
                        selected={!selectedId}
                        disabled={disabled}
                        onSelect={() => onChange?.("")}
                        onPreview={() =>
                            openPreview(defaultTemplate, "Default by system")
                        }
                        selectionLabel="Use default certificate"
                        previewLabel="Preview default certificate"
                    />

                    {templates.map((template) => (
                        <CertificateTile
                            key={template.templateVersionId}
                            title={template.name}
                            subtitle={`Published version ${template.version}`}
                            template={template}
                            selected={
                                selectedId ===
                                normalizedId(template.templateVersionId)
                            }
                            disabled={disabled}
                            onSelect={() =>
                                onChange?.(template.templateVersionId)
                            }
                            onPreview={() =>
                                openPreview(template, template.name)
                            }
                            selectionLabel={`Select ${template.name} certificate`}
                            previewLabel={`Preview ${template.name} certificate`}
                        />
                    ))}
                </Box>

                {!templates.length && (
                    <Typography variant="body2" color="text.secondary">
                        Publish a certificate template to make it available
                        here.
                    </Typography>
                )}
            </Stack>

            <Dialog
                open={Boolean(previewTemplate)}
                onClose={() => setPreviewTemplate(null)}
                maxWidth="md"
                fullWidth
                aria-labelledby="certificate-preview-title"
            >
                <DialogTitle
                    id="certificate-preview-title"
                    sx={{ pr: 7, fontWeight: 750 }}
                >
                    Certificate preview: {previewTemplate?.previewTitle}
                </DialogTitle>
                <IconButton
                    aria-label="Close certificate preview"
                    onClick={() => setPreviewTemplate(null)}
                    sx={{ position: "absolute", top: 10, right: 10 }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent
                    dividers
                    sx={{
                        bgcolor: "#eef1f7",
                        display: "grid",
                        placeItems: "center",
                        minHeight: 430,
                        p: { xs: 2, sm: 4 },
                    }}
                >
                    {previewTemplate && (
                        <CertificateCanvas
                            layout={previewTemplate.layout}
                            widthMm={previewTemplate.widthMm}
                            heightMm={previewTemplate.heightMm}
                            sx={{
                                width:
                                    previewTemplate.orientation === "portrait"
                                        ? "48%"
                                        : "92%",
                                maxWidth: 780,
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CertificateTemplateSelector;
