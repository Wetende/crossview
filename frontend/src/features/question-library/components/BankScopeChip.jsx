import { Chip } from "@mui/material";

const BANK_SCOPES = {
    course: { label: "Course", color: "default" },
    instructor: { label: "My library", color: "primary" },
    institution: { label: "Shared", color: "success" },
};

const bankScopeLabel = (scope, { ownedByViewer = true } = {}) => {
    if (scope === "instructor" && !ownedByViewer) return "Instructor library";
    return BANK_SCOPES[scope]?.label || BANK_SCOPES.course.label;
};

export default function BankScopeChip({ scope, ownedByViewer = true, sx }) {
    const config = BANK_SCOPES[scope] || BANK_SCOPES.course;
    return (
        <Chip
            size="small"
            variant="outlined"
            color={config.color}
            label={bankScopeLabel(scope, { ownedByViewer })}
            sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, ...sx }}
        />
    );
}
