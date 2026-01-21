/**
 * Unified Dashboard Layout - Non-Clipped Sidebar Pattern
 * Full-height sidebar with collapsible functionality
 * Uses global ThemeContext for dark/light mode
 */

import { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import {
    Box,
    Drawer,
    SwipeableDrawer,
    AppBar,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useMediaQuery,
    useTheme,
    Breadcrumbs,
    Tooltip,
} from "@mui/material";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SchoolIcon from "@mui/icons-material/School";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import GradingIcon from "@mui/icons-material/Grading";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import RateReviewIcon from "@mui/icons-material/RateReview";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import NotificationsIcon from "@mui/icons-material/Notifications";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BrushIcon from "@mui/icons-material/Brush";
import ApprovalIcon from "@mui/icons-material/Approval";

// Custom Components
import NotificationPanel from "@/components/NotificationPanel";
import { useThemeMode } from "@/theme";

const DRAWER_WIDTH_EXPANDED = 240;
const DRAWER_WIDTH_COLLAPSED = 72;
const SIDEBAR_HEADER_HEIGHT = 56;

// Navigation menus for each role
const roleNavigation = {
    student: [
        {
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
                {
                    label: "My Programs",
                    href: "/student/programs/",
                    icon: SchoolIcon,
                },
                {
                    label: "Assessments",
                    href: "/student/assessments/",
                    icon: AssignmentIcon,
                },
                {
                    label: "Practicum",
                    href: "/student/practicum/",
                    icon: RateReviewIcon,
                },
                {
                    label: "Certificates",
                    href: "/student/certificates/",
                    icon: CardMembershipIcon,
                },
                {
                    label: "Profile",
                    href: "/student/profile/",
                    icon: PersonIcon,
                },
            ],
        },
    ],
    instructor: [
        {
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
            ],
        },
        {
            title: "Teaching",
            items: [
                {
                    label: "My Programs",
                    href: "/instructor/programs/",
                    icon: SchoolIcon,
                },
                {
                    label: "My Students",
                    href: "/instructor/students/",
                    icon: PeopleIcon,
                },
                {
                    label: "Assignments",
                    href: "/instructor/assignments/",
                    icon: AssignmentIcon,
                },
                {
                    label: "Announcements",
                    href: "/instructor/announcements/",
                    icon: AssignmentIcon,
                },
                {
                    label: "Gradebook",
                    href: "/instructor/gradebook/",
                    icon: GradingIcon,
                },
                {
                    label: "Rubrics",
                    href: "/rubrics/",
                    icon: GradingIcon,
                    requiresFeature: "practicum",
                },
                {
                    label: "Practicum Review",
                    href: "/instructor/practicum/",
                    icon: RateReviewIcon,
                    requiresFeature: "practicum",
                },
            ],
        },
    ],
    admin: [
        {
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
            ],
        },
        {
            title: "Academic",
            items: [
                {
                    label: "Programs",
                    href: "/admin/programs/",
                    icon: SchoolIcon,
                },
                {
                    label: "Course Approvals",
                    href: "/admin/course-approval/",
                    icon: ApprovalIcon,
                },
                {
                    label: "Rubrics",
                    href: "/rubrics/",
                    icon: GradingIcon,
                    requiresFeature: "practicum",
                },
            ],
        },
        {
            title: "Management",
            items: [
                { label: "Users", href: "/admin/users/", icon: PeopleIcon },
                {
                    label: "Instructor Vetting",
                    href: "/admin/instructor-applications/",
                    icon: VerifiedUserIcon,
                },
                {
                    label: "Enrollments",
                    href: "/admin/enrollments/",
                    icon: AssignmentIcon,
                },
                {
                    label: "Certificates",
                    href: "/admin/certificates/",
                    icon: CardMembershipIcon,
                },
            ],
        },
        {
            title: "Settings",
            items: [
                {
                    label: "General",
                    href: "/admin/settings/",
                    icon: SettingsIcon,
                },
            ],
        },
    ],
    superadmin: [
        {
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
                {
                    label: "Platform Settings",
                    href: "/superadmin/platform/",
                    icon: SettingsIcon,
                },
                {
                    label: "Blueprints",
                    href: "/superadmin/presets/",
                    icon: ArchitectureIcon,
                },
                { label: "Users", href: "/admin/users/", icon: PeopleIcon },
                { label: "Logs", href: "/superadmin/logs/", icon: HistoryIcon },
            ],
        },
    ],
};

const roleColors = {
    student: "primary",
    instructor: "success",
    admin: "warning",
    superadmin: "error",
};

const STORAGE_KEY_COLLAPSED = "dashboard_sidebar_collapsed";

export default function DashboardLayout({
    children,
    breadcrumbs = [],
    role: propRole,
}) {
    const theme = useTheme();
    const { isDark, toggleMode } = useThemeMode();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(STORAGE_KEY_COLLAPSED) === "true";
        }
        return false;
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const { auth, platform } = usePage().props;

    const role = propRole || auth?.user?.role || "student";
    const navigation = roleNavigation[role] || roleNavigation.student;
    const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
    const drawerWidth =
        collapsed && !isMobile ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

    // Persist collapse state
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_COLLAPSED, collapsed.toString());
        }
    }, [collapsed]);

    const handleDrawerOpen = () => setMobileOpen(true);
    const handleDrawerClose = () => setMobileOpen(false);
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleCollapseToggle = () => setCollapsed(!collapsed);

    const handleNavClick = () => {
        if (isMobile) handleDrawerClose();
    };

    const handleLogout = () => {
        router.post("/logout/");
    };

    const iOS =
        typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent);

    const drawerContent = (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.paper",
                color: "text.primary",
                transition: "width 0.2s ease-in-out",
            }}
        >
            {/* Sidebar Header - Logo & Collapse Toggle */}
            <Box
                sx={{
                    height: SIDEBAR_HEADER_HEIGHT,
                    minHeight: SIDEBAR_HEADER_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        collapsed && !isMobile ? "center" : "flex-start",
                    px: collapsed && !isMobile ? 1.5 : 2,
                    borderBottom: 1,
                    borderColor: "divider",
                    gap: 1,
                    borderRadius: 0,
                }}
            >
                {/* Logo */}
                <IconButton
                    component={Link}
                    href="/"
                    sx={{
                        color: "primary.main",
                        borderRadius: 0,
                    }}
                    aria-label="home"
                >
                    <SchoolIcon sx={{ fontSize: 28 }} />
                </IconButton>

                {/* Institution Name - only when expanded */}
                {(!collapsed || isMobile) && (
                    <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="primary"
                        sx={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {platform?.institutionName || "Crossview"}
                    </Typography>
                )}

                {/* Spacer when collapsed */}
                {collapsed && !isMobile && <Box sx={{ flex: 1 }} />}

                {/* Collapse Toggle - Desktop only */}
                {!isMobile && (
                    <IconButton
                        onClick={handleCollapseToggle}
                        size="small"
                        sx={{
                            color: "text.secondary",
                            borderRadius: 0,
                        }}
                        aria-label={
                            collapsed ? "Expand sidebar" : "Collapse sidebar"
                        }
                    >
                        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                )}
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
                {navigation.map((section, sectionIndex) => {
                    const filteredItems = section.items.filter((item) => {
                        if (!item.requiresFeature) return true;
                        return (
                            platform?.features?.[item.requiresFeature] === true
                        );
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                        <Box key={sectionIndex}>
                            {section.title && (!collapsed || isMobile) && (
                                <Typography
                                    variant="overline"
                                    sx={{
                                        px: 2,
                                        py: 0.5,
                                        display: "block",
                                        color: "text.secondary",
                                        fontSize: "0.7rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    {section.title}
                                </Typography>
                            )}
                            <List disablePadding>
                                {filteredItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive =
                                        currentPath === item.href ||
                                        (item.href !== "/dashboard/" &&
                                            currentPath.startsWith(item.href));

                                    const listItemButton = (
                                        <ListItemButton
                                            component={Link}
                                            href={item.href}
                                            onClick={handleNavClick}
                                            selected={isActive}
                                            sx={{
                                                borderRadius: 1,
                                                minHeight: 40,
                                                justifyContent:
                                                    collapsed && !isMobile
                                                        ? "center"
                                                        : "flex-start",
                                                px:
                                                    collapsed && !isMobile
                                                        ? 1.5
                                                        : 2,
                                                "&.Mui-selected": {
                                                    bgcolor: "primary.main",
                                                    color: "primary.contrastText",
                                                    "&:hover": {
                                                        bgcolor: "primary.dark",
                                                    },
                                                    "& .MuiListItemIcon-root": {
                                                        color: "primary.contrastText",
                                                    },
                                                },
                                            }}
                                        >
                                            <ListItemIcon
                                                sx={{
                                                    minWidth:
                                                        collapsed && !isMobile
                                                            ? 0
                                                            : 36,
                                                    color: isActive
                                                        ? "inherit"
                                                        : "text.secondary",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Icon sx={{ fontSize: 20 }} />
                                            </ListItemIcon>
                                            {(!collapsed || isMobile) && (
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{
                                                        fontSize: "0.875rem",
                                                        fontWeight: isActive
                                                            ? 600
                                                            : 400,
                                                    }}
                                                />
                                            )}
                                        </ListItemButton>
                                    );

                                    return (
                                        <ListItem
                                            key={item.href}
                                            disablePadding
                                            sx={{ px: 1, py: 0.25 }}
                                        >
                                            {collapsed && !isMobile ? (
                                                <Tooltip
                                                    title={item.label}
                                                    placement="right"
                                                    arrow
                                                >
                                                    {listItemButton}
                                                </Tooltip>
                                            ) : (
                                                listItemButton
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );

    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                bgcolor: "background.default",
            }}
        >
            {/* Sidebar - Full Height (Non-Clipped) */}
            <Box
                component="nav"
                sx={{
                    width: { md: drawerWidth },
                    flexShrink: { md: 0 },
                    transition: "width 0.2s ease-in-out",
                }}
            >
                {/* Mobile Drawer */}
                <SwipeableDrawer
                    variant="temporary"
                    open={mobileOpen}
                    onOpen={handleDrawerOpen}
                    onClose={handleDrawerClose}
                    disableBackdropTransition={!iOS}
                    disableDiscovery={iOS}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: "block", md: "none" },
                        "& .MuiDrawer-paper": {
                            width: DRAWER_WIDTH_EXPANDED,
                            boxSizing: "border-box",
                            borderRadius: 0,
                        },
                    }}
                >
                    {drawerContent}
                </SwipeableDrawer>

                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", md: "block" },
                        "& .MuiDrawer-paper": {
                            width: drawerWidth,
                            boxSizing: "border-box",
                            borderRight: 1,
                            borderColor: "divider",
                            transition: "width 0.2s ease-in-out",
                            overflowX: "hidden",
                            borderRadius: 0,
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    transition: "width 0.2s ease-in-out",
                }}
            >
                {/* AppBar - Content Width Only */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: "background.paper",
                        color: "text.primary",
                        boxShadow: "none",
                        borderBottom: 1,
                        borderColor: "divider",
                        borderRadius: 0,
                    }}
                >
                    <Toolbar
                        sx={{
                            minHeight: `${SIDEBAR_HEADER_HEIGHT}px !important`,
                            height: SIDEBAR_HEADER_HEIGHT,
                            px: 2,
                        }}
                    >
                        {/* Mobile Menu Button */}
                        <IconButton
                            onClick={handleDrawerToggle}
                            sx={{
                                display: { md: "none" },
                                mr: 1,
                                color: "text.primary",
                            }}
                            aria-label="toggle menu"
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Breadcrumbs */}
                        <Box sx={{ flex: 1 }}>
                            {breadcrumbs.length > 0 && (
                                <Breadcrumbs
                                    separator={
                                        <NavigateNextIcon fontSize="small" />
                                    }
                                >
                                    {breadcrumbs.map((crumb, index) => {
                                        const isLast =
                                            index === breadcrumbs.length - 1;
                                        return crumb.href && !isLast ? (
                                            <Link
                                                key={index}
                                                href={crumb.href}
                                                style={{
                                                    textDecoration: "none",
                                                }}
                                            >
                                                <Typography
                                                    color="text.secondary"
                                                    variant="body2"
                                                >
                                                    {crumb.label}
                                                </Typography>
                                            </Link>
                                        ) : (
                                            <Typography
                                                key={index}
                                                color="text.primary"
                                                variant="body2"
                                            >
                                                {crumb.label}
                                            </Typography>
                                        );
                                    })}
                                </Breadcrumbs>
                            )}
                        </Box>

                        {/* Right Side Controls */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                            }}
                        >
                            {/* Dark/Light Mode Toggle */}
                            <Tooltip
                                title={isDark ? "Light mode" : "Dark mode"}
                            >
                                <IconButton
                                    onClick={toggleMode}
                                    sx={{ color: "text.secondary" }}
                                    aria-label="toggle dark mode"
                                >
                                    {isDark ? (
                                        <LightModeIcon />
                                    ) : (
                                        <DarkModeIcon />
                                    )}
                                </IconButton>
                            </Tooltip>

                            {/* Notifications Panel */}
                            <NotificationPanel />

                            {/* User Avatar & Menu */}
                            <IconButton
                                onClick={handleMenuOpen}
                                aria-label="user menu"
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: `${roleColors[role]}.main`,
                                    }}
                                >
                                    {auth?.user?.firstName?.[0] || "U"}
                                </Avatar>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                            >
                                <MenuItem disabled>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {auth?.user?.email}
                                    </Typography>
                                </MenuItem>
                                <Divider />
                                {role === "student" && (
                                    <MenuItem
                                        component={Link}
                                        href="/student/profile/"
                                    >
                                        <ListItemIcon>
                                            <PersonIcon fontSize="small" />
                                        </ListItemIcon>
                                        Profile
                                    </MenuItem>
                                )}
                                {(role === "admin" ||
                                    role === "superadmin") && (
                                    <MenuItem
                                        component={Link}
                                        href="/admin/settings/"
                                    >
                                        <ListItemIcon>
                                            <SettingsIcon fontSize="small" />
                                        </ListItemIcon>
                                        Settings
                                    </MenuItem>
                                )}
                                <Divider />
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </AppBar>

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, md: 3 },
                        bgcolor: "background.default",
                        minHeight: `calc(100vh - ${SIDEBAR_HEADER_HEIGHT}px)`,
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
