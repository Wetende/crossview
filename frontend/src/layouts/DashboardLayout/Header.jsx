import { useState } from "react";
import { router } from "@inertiajs/react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Badge,
    Typography,
    Divider,
} from "@mui/material";
import {
    IconMenu2,
    IconBell,
    IconUser,
    IconSettings,
    IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Header - Top bar with menu toggle, notifications, and user menu
 */
export default function Header({ onMenuClick, sidebarOpen, isMobile }) {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path) => {
        handleMenuClose();
        router.visit(path);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await logout();
        router.visit("/login");
    };

    // Generate initials from user name
    const getInitials = () => {
        if (!user) return "?";
        const first = user.first_name?.[0] || "";
        const last = user.last_name?.[0] || "";
        return (
            (first + last).toUpperCase() ||
            user.email?.[0]?.toUpperCase() ||
            "?"
        );
    };

    const getFullName = () => {
        if (!user) return "";
        return (
            [user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.email
        );
    };

    return (
        <AppBar
            position="sticky"
            color="inherit"
            elevation={0}
            sx={{
                backgroundColor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
            }}
        >
            <Toolbar sx={{ justifyContent: "space-between" }}>
                {/* Left side - Menu toggle */}
                <IconButton
                    onClick={onMenuClick}
                    edge="start"
                    aria-label={
                        sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
                    }
                >
                    <IconMenu2 size={24} />
                </IconButton>

                {/* Right side - Notifications and User */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Notifications */}
                    <IconButton aria-label="Notifications">
                        <Badge badgeContent={0} color="error">
                            <IconBell size={22} />
                        </Badge>
                    </IconButton>

                    {/* User info (desktop only) */}
                    {!isMobile && user && (
                        <Box sx={{ ml: 1, mr: 1, textAlign: "right" }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                {getFullName()}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {user.role}
                            </Typography>
                        </Box>
                    )}

                    {/* User Avatar */}
                    <IconButton
                        onClick={handleMenuOpen}
                        aria-label="User menu"
                        aria-controls={menuOpen ? "user-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen ? "true" : undefined}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "primary.main",
                                fontSize: 14,
                            }}
                            src={user?.avatar_url}
                        >
                            {getInitials()}
                        </Avatar>
                    </IconButton>

                    {/* User Menu Dropdown */}
                    <Menu
                        id="user-menu"
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        transformOrigin={{
                            horizontal: "right",
                            vertical: "top",
                        }}
                        anchorOrigin={{
                            horizontal: "right",
                            vertical: "bottom",
                        }}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                minWidth: 200,
                            },
                        }}
                    >
                        {/* User info in menu (mobile) */}
                        {isMobile && user && (
                            <>
                                <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                    >
                                        {getFullName()}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {user.email}
                                    </Typography>
                                </Box>
                                <Divider />
                            </>
                        )}

                        <MenuItem onClick={() => handleNavigation("/profile")}>
                            <ListItemIcon>
                                <IconUser size={20} />
                            </ListItemIcon>
                            <ListItemText>Profile</ListItemText>
                        </MenuItem>

                        <MenuItem onClick={() => handleNavigation("/settings")}>
                            <ListItemIcon>
                                <IconSettings size={20} />
                            </ListItemIcon>
                            <ListItemText>Settings</ListItemText>
                        </MenuItem>

                        <Divider />

                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <IconLogout size={20} />
                            </ListItemIcon>
                            <ListItemText>Logout</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
