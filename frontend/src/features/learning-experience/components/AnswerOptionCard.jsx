import { FormControlLabel, Paper } from "@mui/material";

const AnswerOptionCard = ({
    control,
    label,
    selected = false,
    disabled = false,
}) => (
    <Paper
        variant="outlined"
        sx={{
            mb: 1.25,
            borderRadius: 1.5,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? "primary.main" : "divider",
            bgcolor: selected ? "primary.lighter" : "background.paper",
            color: disabled ? "text.disabled" : "text.primary",
            transition: "background-color 180ms ease, border-color 180ms ease",
            "&:hover": disabled
                ? undefined
                : {
                      borderColor: "primary.main",
                      bgcolor: selected ? "primary.lighter" : "action.hover",
                  },
            "&:focus-within": {
                outline: "3px solid",
                outlineColor: "primary.light",
                outlineOffset: 2,
            },
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
    >
        <FormControlLabel
            disabled={disabled}
            control={control}
            label={label}
            sx={{
                width: "100%",
                minHeight: 54,
                m: 0,
                px: 1.5,
                py: 0.75,
                alignItems: "center",
                "& .MuiFormControlLabel-label": {
                    fontWeight: selected ? 700 : 500,
                    lineHeight: 1.45,
                },
            }}
        />
    </Paper>
);

export default AnswerOptionCard;
