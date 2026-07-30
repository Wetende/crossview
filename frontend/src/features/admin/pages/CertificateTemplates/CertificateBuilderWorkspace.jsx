import {
    Box,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const RULER_MARKS = Array.from({ length: 11 }, (_, index) => index * 100);

const HorizontalRuler = () => (
    <Box
        data-testid="horizontal-ruler"
        aria-hidden="true"
        sx={{
            position: "relative",
            minWidth: 620,
            borderBottom: "1px solid",
            borderColor: "#d8dee8",
            bgcolor: "#f8fafc",
            backgroundImage:
                "repeating-linear-gradient(to right, transparent 0, transparent 9px, rgba(100,116,139,.28) 9px, rgba(100,116,139,.28) 10px)",
        }}
    >
        {RULER_MARKS.map((mark, index) => (
            <Typography
                key={mark}
                component="span"
                sx={{
                    position: "absolute",
                    left: `${index * 10}%`,
                    top: 2,
                    ml: index ? -1 : 0.5,
                    color: "#8290a4",
                    fontSize: 8,
                    lineHeight: 1,
                }}
            >
                {mark}
            </Typography>
        ))}
    </Box>
);

const VerticalRuler = () => (
    <Box
        data-testid="vertical-ruler"
        aria-hidden="true"
        sx={{
            position: "relative",
            minHeight: 440,
            borderRight: "1px solid",
            borderColor: "#d8dee8",
            bgcolor: "#f8fafc",
            backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0, transparent 9px, rgba(100,116,139,.28) 9px, rgba(100,116,139,.28) 10px)",
        }}
    >
        {RULER_MARKS.map((mark, index) => (
            <Typography
                key={mark}
                component="span"
                sx={{
                    position: "absolute",
                    top: `${index * 10}%`,
                    left: 4,
                    mt: index ? -1 : 0.5,
                    color: "#8290a4",
                    fontSize: 8,
                    lineHeight: 1,
                    writingMode: "vertical-rl",
                }}
            >
                {mark}
            </Typography>
        ))}
    </Box>
);

export default function CertificateBuilderWorkspace({
    title = "Certificate Builder",
    backHref,
    navigation,
    headerActions,
    children,
}) {
    return (
        <Box
            data-testid="certificate-builder-workspace"
            sx={{
                height: "100dvh",
                minHeight: 620,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "#eef2f7",
            }}
        >
            <Paper
                component="header"
                square
                elevation={0}
                sx={{
                    height: 52,
                    flexShrink: 0,
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(220px, 1fr) auto minmax(220px, 1fr)",
                    alignItems: "center",
                    px: 1.25,
                    borderRadius: 0,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    zIndex: 4,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Tooltip title="Back to certificate dashboard">
                        <IconButton
                            component="a"
                            href={backHref}
                            size="small"
                            aria-label="Back to certificate dashboard"
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Typography
                        component="h1"
                        variant="subtitle1"
                        fontWeight={800}
                        noWrap
                    >
                        {title}
                    </Typography>
                </Stack>
                <Box sx={{ alignSelf: "stretch", minWidth: 0 }}>
                    {navigation}
                </Box>
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ minWidth: 0 }}
                >
                    {headerActions}
                </Stack>
            </Paper>

            <Box
                component="main"
                aria-label="Certificate builder workspace"
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export function CertificateCanvasRulers({ children }) {
    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                display: "grid",
                gridTemplateColumns: "26px minmax(0, 1fr)",
                gridTemplateRows: "22px minmax(0, 1fr)",
            }}
        >
            <Box
                sx={{
                    borderRight: "1px solid",
                    borderBottom: "1px solid",
                    borderColor: "#d8dee8",
                    bgcolor: "#f8fafc",
                }}
            />
            <HorizontalRuler />
            <VerticalRuler />
            <Box sx={{ minWidth: 0, minHeight: 0 }}>{children}</Box>
        </Box>
    );
}
