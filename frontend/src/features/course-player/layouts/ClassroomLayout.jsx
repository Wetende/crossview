import {
    Box,
    IconButton,
    useTheme,
    useMediaQuery,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Drawer,
    SwipeableDrawer,
    Tooltip,
} from "@mui/material";
import { Link } from "@inertiajs/react";
import {
    Menu as MenuIcon,
    ArrowBack,
    Close as CloseIcon,
    DarkMode,
    LightMode,
    ChatBubbleOutlined,
    MailOutlined,
} from "@mui/icons-material";
import ThemeProvider, { useThemeMode } from "@/theme";
import { FONT_FIGTREE } from "@/config";
import { SESSION_CONTROL_HEIGHT } from "../components/Stage/SessionControl";

// The player uses one sans-serif family for headings and body text.
const PLAYER_HEADING_VARIANTS = ["h1", "h2", "h3", "h4", "h5", "h6"];
const extendPlayerTheme = () => ({
    typography: Object.fromEntries(
        PLAYER_HEADING_VARIANTS.map((variant) => [
            variant,
            { fontFamily: FONT_FIGTREE },
        ]),
    ),
});

const ClassroomLayoutInner = ({
    children,
    programTitle,
    backLink,
    RightPanel,
    LeftPanel,
    isSidebarOpen,
    onToggleSidebar,
    isDiscussionsOpen,
    onToggleDiscussions,
    messageInstructorHref = null,
}) => {
    const theme = useTheme();
    const { isDark, toggleMode } = useThemeMode();
    
    // Responsive breakpoints - 2 media queries (isTablet derived from isMobile && !isDesktop)
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const isTablet = !isMobile && !isDesktop; // Derived instead of separate query

    const mobileSidebarWidth = 280;
    const desktopSidebarWidth = 336;
    const sidebarWidth = isDesktop ? desktopSidebarWidth : mobileSidebarWidth;
    const discussionsWidth = isMobile ? '100%' : 320;
    const hasRightPanel = Boolean(RightPanel);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                height: "100dvh",
                bgcolor: "background.default",
                overflow: "hidden",
            }}
        >
            {/* Header Bar */}
            <AppBar
                position="static"
                color="default"
                elevation={0}
                sx={{
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    zIndex: theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar
                    variant="dense"
                    sx={{ minHeight: 48, justifyContent: "space-between" }}
                >
                    {/* Left Section */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton
                            size="small"
                            component={Link}
                            href={backLink}
                            sx={{ color: "text.secondary" }}
                        >
                            <ArrowBack fontSize="small" />
                        </IconButton>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                cursor: "pointer",
                            }}
                            onClick={onToggleSidebar}
                        >
                            <MenuIcon fontSize="small" />
                            {!isMobile && (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    Curriculum
                                </Typography>
                            )}
                            {isSidebarOpen && !isMobile && (
                                <CloseIcon fontSize="small" sx={{ ml: 0.5 }} />
                            )}
                        </Box>

                        {!isMobile && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    ml: 2,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    sx={{ lineHeight: 1 }}
                                >
                                    Course
                                </Typography>
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{ fontWeight: 600, maxWidth: 300, color: "text.primary" }}
                                >
                                    {programTitle}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Right Section */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={toggleMode}
                            sx={{ color: "text.secondary" }}
                        >
                            {isDark ? (
                                <LightMode fontSize="small" />
                            ) : (
                                <DarkMode fontSize="small" />
                            )}
                        </IconButton>

                        {messageInstructorHref && (
                            <Tooltip title="Message instructor">
                                <IconButton
                                    size="small"
                                    component={Link}
                                    href={messageInstructorHref}
                                    aria-label="Message instructor"
                                    sx={{ color: "text.secondary" }}
                                >
                                    <MailOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}

                        {hasRightPanel && (
                            <Button
                                size="small"
                                startIcon={!isMobile && <ChatBubbleOutlined fontSize="small" />}
                                onClick={onToggleDiscussions}
                                sx={{
                                    textTransform: "none",
                                    color: isDiscussionsOpen
                                        ? "primary.main"
                                        : "text.secondary",
                                    minWidth: isMobile ? 40 : 'auto',
                                    px: isMobile ? 1 : 2,
                                }}
                            >
                                {isMobile ? <ChatBubbleOutlined fontSize="small" /> : 'Discussions'}
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content Area */}
            <Box
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* Left Sidebar (Curriculum) - Drawer on mobile, inline on desktop */}
                {isMobile || isTablet ? (
                    <SwipeableDrawer
                        anchor="left"
                        open={isSidebarOpen}
                        onClose={onToggleSidebar}
                        onOpen={onToggleSidebar}
                        disableSwipeToOpen={false}
                        swipeAreaWidth={20}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: sidebarWidth,
                                boxSizing: 'border-box',
                            },
                        }}
                    >
                        <Box sx={{ pt: 6, height: "100%", boxSizing: "border-box" }}>
                            {LeftPanel}
                        </Box>
                    </SwipeableDrawer>
                ) : (
                    <Box
                        component="nav"
                        sx={{
                            width: isSidebarOpen ? sidebarWidth : 0,
                            flexShrink: 0,
                            borderRight: isSidebarOpen ? "1px solid" : "none",
                            borderColor: "divider",
                            transition: theme.transitions.create("width", {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            overflow: "hidden",
                            bgcolor: "background.paper",
                        }}
                    >
                        <Box sx={{ width: sidebarWidth, height: "100%", overflowY: "auto" }}>
                            {LeftPanel}
                        </Box>
                    </Box>
                )}

                {/* Center Stage (Content) - Expands to fill available space */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        minHeight: 0,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "background.default",
                        position: "relative",
                        // Adjust margin when discussions is open (desktop only)
                        marginRight: hasRightPanel && isDiscussionsOpen && isDesktop
                            ? `${discussionsWidth}px`
                            : 0,
                        transition: theme.transitions.create("margin", {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }}
                >
                    <Box
                        sx={{
                            flexGrow: 1,
                            overflowY: "auto",
                            px: { xs: 2, sm: 3, md: 6 },
                            py: { xs: 2, md: 3 },
                            maxWidth: 900,
                            mx: "auto",
                            width: "100%",
                            // Keep content clear of the sticky lesson footer.
                            scrollPaddingBottom: `${SESSION_CONTROL_HEIGHT}px`,
                            // Hide scrollbar
                            "&::-webkit-scrollbar": { display: "none" },
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                        }}
                    >
                        {children}
                    </Box>
                </Box>

                {/* Right Sidebar (Discussions) - Full screen on mobile, overlay on desktop */}
                {hasRightPanel && isMobile ? (
                    <Drawer
                        anchor="right"
                        open={isDiscussionsOpen}
                        onClose={onToggleDiscussions}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: '100%',
                                boxSizing: 'border-box',
                            },
                        }}
                    >
                        {RightPanel}
                    </Drawer>
                ) : hasRightPanel ? (
                    <Box
                        sx={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: discussionsWidth,
                            bgcolor: "background.paper",
                            borderLeft: "1px solid",
                            borderColor: "divider",
                            transform: isDiscussionsOpen
                                ? "translateX(0)"
                                : `translateX(${discussionsWidth}px)`,
                            transition: theme.transitions.create("transform", {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                            zIndex: 10,
                            overflowY: "auto",
                        }}
                    >
                        {RightPanel}
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
};

const ClassroomLayout = (props) => (
    <ThemeProvider
        storageKey="lms_theme_classroom"
        extendTheme={extendPlayerTheme}
    >
        <ClassroomLayoutInner {...props} />
    </ThemeProvider>
);

export default ClassroomLayout;
