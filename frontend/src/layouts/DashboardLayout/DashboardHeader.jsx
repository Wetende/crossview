import { Link } from "@inertiajs/react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import PersonIcon from "@mui/icons-material/Person";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SettingsIcon from "@mui/icons-material/Settings";

import MessageUnreadBadge from "@/components/MessageUnreadBadge";
import NotificationPanel from "@/components/NotificationPanel";

const ROLE_COLORS = {
    student: "#166534",
    instructor: "#22C55E",
    admin: "#14532D",
};

const DashboardHeader = ({
    anchorEl,
    auth,
    breadcrumbs,
    collapsed,
    drawerWidth,
    isDark,
    isMobile,
    onCollapseToggle,
    onLogout,
    onMenuClose,
    onMenuOpen,
    onMobileToggle,
    platform,
    role,
    toggleMode,
}) => {
    const firstName =
        auth?.user?.firstName || auth?.user?.email?.split("@")[0] || "there";

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                height: { xs: 64, md: 88 },
                bgcolor: "background.paper",
                color: "text.primary",
                borderBottom: "1px solid",
                borderColor: "divider",
                borderRadius: 0,
                boxShadow: "0 3px 14px rgba(15, 23, 42, 0.08)",
            }}
        >
            <Toolbar
                disableGutters
                sx={{
                    minHeight: { xs: "64px !important", md: "88px !important" },
                    height: "100%",
                }}
            >
                <Box
                    component={Link}
                    href="/"
                    aria-label="LMS home"
                    sx={{
                        width: { xs: "auto", md: drawerWidth },
                        height: "100%",
                        px: { xs: 1.5, md: collapsed ? 1.25 : 2.5 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        flexShrink: 0,
                        textDecoration: "none",
                        bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                                ? "#FFFFFF"
                                : "transparent",
                        transition: "width 200ms ease",
                        borderRight: { xs: 0, md: "1px solid" },
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            width: { xs: 42, md: 50 },
                            height: { xs: 42, md: 50 },
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "#166534",
                            color: "#FFFFFF",
                        }}
                    >
                        <SchoolOutlinedIcon
                            sx={{ fontSize: { xs: 26, md: 31 } }}
                        />
                    </Box>
                    {collapsed || isMobile ? null : (
                        <Box sx={{ ml: 1.25, minWidth: 0 }}>
                            <Typography
                                sx={{
                                    color: "#166534",
                                    fontFamily: "Archivo, sans-serif",
                                    fontSize: "0.94rem",
                                    fontWeight: 700,
                                    lineHeight: 1.05,
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                LEARNING
                            </Typography>
                            <Typography
                                sx={{
                                    color: "#22C55E",
                                    fontSize: "0.63rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                }}
                            >
                                MANAGEMENT SYSTEM
                            </Typography>
                        </Box>
                    )}
                </Box>

                <IconButton
                    onClick={isMobile ? onMobileToggle : onCollapseToggle}
                    aria-label={
                        isMobile
                            ? "toggle menu"
                            : collapsed
                              ? "Expand sidebar"
                              : "Collapse sidebar"
                    }
                    sx={{ ml: { xs: 0, md: 2 }, color: "#166534" }}
                >
                    {isMobile ? (
                        <MenuIcon />
                    ) : collapsed ? (
                        <ChevronRightIcon />
                    ) : (
                        <ChevronLeftIcon />
                    )}
                </IconButton>

                <Box
                    sx={{
                        ml: 1,
                        minWidth: 0,
                        display: { xs: "none", sm: "block" },
                    }}
                >
                    <Typography
                        sx={{
                            color: "primary.main",
                            fontFamily: "Archivo, sans-serif",
                            fontSize: { sm: "0.98rem", lg: "1.12rem" },
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {platform?.institutionName ||
                            "Learning Management System"}
                    </Typography>
                    {breadcrumbs.length > 0 ? (
                        <Breadcrumbs
                            separator={
                                <NavigateNextIcon sx={{ fontSize: 14 }} />
                            }
                            aria-label="breadcrumb"
                            sx={{
                                mt: 0.15,
                                "& .MuiBreadcrumbs-separator": { mx: 0.35 },
                            }}
                        >
                            {breadcrumbs.map((crumb, index) => {
                                const last = index === breadcrumbs.length - 1;
                                return crumb.href && !last ? (
                                    <Typography
                                        key={`${crumb.label}-${index}`}
                                        component={Link}
                                        href={crumb.href}
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ textDecoration: "none" }}
                                    >
                                        {crumb.label}
                                    </Typography>
                                ) : (
                                    <Typography
                                        key={`${crumb.label}-${index}`}
                                        variant="caption"
                                        color="text.primary"
                                    >
                                        {crumb.label}
                                    </Typography>
                                );
                            })}
                        </Breadcrumbs>
                    ) : null}
                </Box>

                <Box sx={{ flex: 1 }} />
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 0, md: 0.5 },
                        pr: { xs: 0.5, md: 2 },
                    }}
                >
                    <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                        <IconButton
                            onClick={toggleMode}
                            aria-label="toggle dark mode"
                            sx={{ color: "text.secondary" }}
                        >
                            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                    <MessageUnreadBadge />
                    <NotificationPanel />
                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{ mx: { xs: 0.25, md: 1 } }}
                    />
                    <IconButton
                        onClick={onMenuOpen}
                        aria-label="user menu"
                        sx={{ borderRadius: 1.5, gap: 1 }}
                    >
                        <Avatar
                            sx={{
                                width: 34,
                                height: 34,
                                bgcolor:
                                    ROLE_COLORS[role] || ROLE_COLORS.student,
                                color: "#FFFFFF",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                            }}
                        >
                            {firstName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography
                            variant="body2"
                            sx={{
                                display: { xs: "none", lg: "block" },
                                color: "primary.main",
                                fontWeight: 600,
                            }}
                        >
                            Hi, {firstName}
                        </Typography>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={onMenuClose}
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
                            <Typography variant="body2" color="text.secondary">
                                {auth?.user?.email}
                            </Typography>
                        </MenuItem>
                        <Divider />
                        {role === "student" ? (
                            <MenuItem
                                component={Link}
                                href="/student/profile/"
                                onClick={onMenuClose}
                            >
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" />
                                </ListItemIcon>
                                Profile
                            </MenuItem>
                        ) : null}
                        {role === "admin" &&
                        platform?.capabilities?.showAdminSettings !== false ? (
                            <MenuItem
                                component={Link}
                                href="/admin/settings/"
                                onClick={onMenuClose}
                            >
                                <ListItemIcon>
                                    <SettingsIcon fontSize="small" />
                                </ListItemIcon>
                                Settings
                            </MenuItem>
                        ) : null}
                        <Divider />
                        <MenuItem onClick={onLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default DashboardHeader;
