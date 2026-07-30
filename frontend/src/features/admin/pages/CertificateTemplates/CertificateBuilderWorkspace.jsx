import {
    Box,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const HORIZONTAL_RULER_MARKS = Array.from(
    { length: 17 },
    (_, index) => index * 100,
);
const VERTICAL_RULER_MARKS = Array.from(
    { length: 12 },
    (_, index) => index * 100,
);

const rulerPosition = (index, marks) =>
    `${(index / (marks.length - 1)) * 100}%`;

const HorizontalRuler = () => (
    <Box
        data-testid="horizontal-ruler"
        aria-hidden="true"
        sx={{
            position: "relative",
            minWidth: 620,
            borderBottom: "1px solid",
            borderColor: "#d8dee8",
            bgcolor: "#ffffff",
            backgroundImage: [
                "linear-gradient(to right, transparent 0, transparent calc(100% - 1px), rgba(100,116,139,.32) calc(100% - 1px), rgba(100,116,139,.32) 100%)",
                "linear-gradient(to right, transparent 0, transparent calc(100% - 1px), rgba(71,85,105,.48) calc(100% - 1px), rgba(71,85,105,.48) 100%)",
            ].join(","),
            backgroundSize: "0.625% 5px, 6.25% 10px",
            backgroundPosition: "left bottom, left bottom",
            backgroundRepeat: "repeat-x",
        }}
    >
        {HORIZONTAL_RULER_MARKS.map((mark, index) => (
            <Typography
                key={mark}
                component="span"
                sx={{
                    position: "absolute",
                    left: rulerPosition(index, HORIZONTAL_RULER_MARKS),
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
            bgcolor: "#ffffff",
            backgroundImage: [
                "linear-gradient(to bottom, transparent 0, transparent calc(100% - 1px), rgba(100,116,139,.32) calc(100% - 1px), rgba(100,116,139,.32) 100%)",
                "linear-gradient(to bottom, transparent 0, transparent calc(100% - 1px), rgba(71,85,105,.48) calc(100% - 1px), rgba(71,85,105,.48) 100%)",
            ].join(","),
            backgroundSize: "5px 0.909%, 10px 9.091%",
            backgroundPosition: "right top, right top",
            backgroundRepeat: "repeat-y",
        }}
    >
        {VERTICAL_RULER_MARKS.map((mark, index) => (
            <Typography
                key={mark}
                component="span"
                sx={{
                    position: "absolute",
                    top: rulerPosition(index, VERTICAL_RULER_MARKS),
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
                data-testid="certificate-builder-header"
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
                    bgcolor: "#eef2f7",
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
                    bgcolor: "#ffffff",
                }}
            />
            <HorizontalRuler />
            <VerticalRuler />
            <Box sx={{ minWidth: 0, minHeight: 0, bgcolor: "#ffffff" }}>
                {children}
            </Box>
        </Box>
    );
}
