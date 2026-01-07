import { useMemo } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Divider,
    Typography,
} from "@mui/material";
import {
    IconHome,
    IconBook,
    IconUsers,
    IconCertificate,
    IconSettings,
    IconLogout,
    IconSchool,
    IconClipboardList,
    IconBuildingCommunity,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from "@/config";

// Navigation items with role-based access
const navigationItems = [
    {
        path: "/dashboard",
        label: "Dashboard",
        icon: IconHome,
        roles: ["student", "instructor", "admin"],
    },
    {
        path: "/programs",
        label: "Programs",
        icon: IconBook,
        roles: ["student", "instructor", "admin"],
    },
    {
        path: "/curriculum",
        label: "Curriculum",
        icon: IconSchool,
        roles: ["instructor", "admin"],
    },
    {
        path: "/assessments",
        label: "Assessments",
        icon: IconClipboardList,
        roles: ["instructor", "admin"],
    },
    {
        path: "/students",
        label: "Students",
        icon: IconUsers,
        roles: ["instructor", "admin"],
    },
    {
        path: "/certificates",
        label: "Certificates",
        icon: IconCertificate,
        roles: ["admin"],
    },
    {
        path: "/platforms",
        label: "Platforms",
        icon: IconBuildingCommunity,
        roles: ["admin"],
    },
];

const bottomItems = [
    { path: "/settings", label: "Settings", icon: IconSettings },
];

/**
 * Sidebar - Navigation component with collapsible state
 */
export default function Sidebar({
    open,
    mobileOpen,
    onMobileClose,
    drawerWidth,
    isMobile,
}) {
    const { url } = usePage();
    const { user, logout } = useAuth();
    const currentPath = url || "/";

    // Filter navigation items based on user role
    const filteredNavItems = useMemo(() => {
        if (!user?.role) return [];
        return navigationItems.filter(
            (item) => !item.roles || item.roles.includes(user.role)
        );
    }, [user?.role]);

    const handleNavigation = (path) => {
        router.visit(path);
        if (isMobile) {
            onMobileClose();
        }
    };

    const handleLogout = async () => {
        await logout();
        router.visit("/login");
    };

    const isActive = (path) =>
        currentPath === path || currentPath.startsWith(path + "/");

    const drawerContent = (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                backgroundColor: "background.paper",
            }}
        >
            {/* Logo */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: open ? "flex-start" : "center",
                    px: open ? 3 : 1,
                    py: 2,
                    minHeight: 64,
                }}
            >
                {open ? (
                    <Typography variant="h6" color="primary" fontWeight={700}>
                        Crossview LMS
                    </Typography>
                ) : (
                    <Typography variant="h6" color="primary" fontWeight={700}>
                        CV
                    </Typography>
                )}
            </Box>

            <Divider />

            {/* Main Navigation */}
            <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
                {filteredNavItems.map((item) => (
                    <NavItem
                        key={item.path}
                        item={item}
                        open={open}
                        active={isActive(item.path)}
                        onClick={() => handleNavigation(item.path)}
                    />
                ))}
            </List>

            <Divider />

            {/* Bottom Navigation */}
            <List sx={{ px: 1, py: 2 }}>
                {bottomItems.map((item) => (
                    <NavItem
                        key={item.path}
                        item={item}
                        open={open}
                        active={isActive(item.path)}
                        onClick={() => handleNavigation(item.path)}
                    />
                ))}
                <NavItem
                    item={{
                        path: "/logout",
                        label: "Logout",
                        icon: IconLogout,
                    }}
                    open={open}
                    active={false}
                    onClick={handleLogout}
                />
            </List>
        </Box>
    );

    // Mobile drawer (temporary)
    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    "& .MuiDrawer-paper": {
                        width: DRAWER_WIDTH,
                        boxSizing: "border-box",
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    // Desktop drawer (permanent)
    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: drawerWidth,
                    boxSizing: "border-box",
                    transition: (theme) =>
                        theme.transitions.create("width", {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    overflowX: "hidden",
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}

/**
 * NavItem - Individual navigation item with tooltip support
 */
function NavItem({ item, open, active, onClick }) {
    const Icon = item.icon;

    const button = (
        <ListItemButton
            onClick={onClick}
            selected={active}
            sx={{
                minHeight: 44,
                justifyContent: open ? "initial" : "center",
                px: 2,
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                    backgroundColor: "primary.lighter",
                    color: "primary.main",
                    "& .MuiListItemIcon-root": {
                        color: "primary.main",
                    },
                },
            }}
            aria-label={item.label}
        >
            <ListItemIcon
                sx={{
                    minWidth: 0,
                    mr: open ? 2 : "auto",
                    justifyContent: "center",
                    color: active ? "primary.main" : "text.secondary",
                }}
            >
                <Icon size={22} stroke={1.5} />
            </ListItemIcon>
            {open && (
                <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: active ? 600 : 400,
                    }}
                />
            )}
        </ListItemButton>
    );

    if (!open) {
        return (
            <Tooltip title={item.label} placement="right" arrow>
                {button}
            </Tooltip>
        );
    }

    return button;
}
