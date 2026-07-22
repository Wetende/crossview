import { useCallback, useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import useLogout from "@/hooks/useLogout";
import { useThemeMode } from "@/theme";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import { filterNavigation, ROLE_NAVIGATION } from "./navigation";

const DRAWER_WIDTH_EXPANDED = 280;
const DRAWER_WIDTH_COLLAPSED = 72;
const HEADER_HEIGHT_DESKTOP = 88;
const HEADER_HEIGHT_MOBILE = 64;
const STORAGE_KEY_COLLAPSED = "dashboard_sidebar_collapsed";

const DashboardLayout = ({ children, breadcrumbs = [], role: propRole }) => {
    const theme = useTheme();
    const { isDark, toggleMode } = useThemeMode();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { props: pageProps, url = "" } = usePage();
    const { auth, platform } = pageProps;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return window.localStorage.getItem(STORAGE_KEY_COLLAPSED) === "true";
    });

    const role = propRole || auth?.user?.role || "student";
    const drawerWidth =
        collapsed && !isMobile ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;
    const currentPath =
        typeof window !== "undefined"
            ? window.location.pathname
            : url.split(/[?#]/)[0];
    const navigation = useMemo(
        () =>
            filterNavigation(
                ROLE_NAVIGATION[role] || ROLE_NAVIGATION.student,
                platform,
            ),
        [platform, role],
    );

    useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(
                STORAGE_KEY_COLLAPSED,
                String(collapsed),
            );
        }
    }, [collapsed]);

    const closeUserMenu = useCallback(() => setAnchorEl(null), []);
    const closeMobileDrawer = useCallback(() => setMobileOpen(false), []);
    const triggerLogout = useLogout({
        onBefore: () => {
            closeUserMenu();
            closeMobileDrawer();
        },
        onSuccess: closeUserMenu,
        onError: closeUserMenu,
    });

    const handleLogout = useCallback(() => triggerLogout(), [triggerLogout]);
    const handleMobileToggle = useCallback(
        () => setMobileOpen((open) => !open),
        [],
    );
    const handleCollapseToggle = useCallback(
        () => setCollapsed((value) => !value),
        [],
    );
    const handleUserMenuOpen = useCallback(
        (event) => setAnchorEl(event.currentTarget),
        [],
    );
    const iOS =
        typeof navigator !== "undefined" &&
        /iPad|iPhone|iPod/.test(navigator.userAgent);

    const sidebar = (
        <DashboardSidebar
            collapsed={collapsed}
            currentPath={currentPath}
            isMobile={isMobile}
            navigation={navigation}
            onLogout={handleLogout}
            onNavigate={closeMobileDrawer}
        />
    );

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
            <DashboardHeader
                anchorEl={anchorEl}
                auth={auth}
                breadcrumbs={breadcrumbs}
                collapsed={collapsed}
                drawerWidth={drawerWidth}
                isDark={isDark}
                isMobile={isMobile}
                onCollapseToggle={handleCollapseToggle}
                onLogout={handleLogout}
                onMenuClose={closeUserMenu}
                onMenuOpen={handleUserMenuOpen}
                onMobileToggle={handleMobileToggle}
                platform={platform}
                role={role}
                toggleMode={toggleMode}
            />

            <Box
                sx={{
                    display: "flex",
                    minHeight: {
                        xs: `calc(100vh - ${HEADER_HEIGHT_MOBILE}px)`,
                        md: `calc(100vh - ${HEADER_HEIGHT_DESKTOP}px)`,
                    },
                    pt: {
                        xs: `${HEADER_HEIGHT_MOBILE}px`,
                        md: `${HEADER_HEIGHT_DESKTOP}px`,
                    },
                }}
            >
                <Box
                    component="aside"
                    sx={{
                        width: { md: drawerWidth },
                        flexShrink: { md: 0 },
                        transition: "width 200ms ease",
                    }}
                >
                    <SwipeableDrawer
                        variant="temporary"
                        open={mobileOpen}
                        onOpen={() => setMobileOpen(true)}
                        onClose={closeMobileDrawer}
                        disableBackdropTransition={!iOS}
                        disableDiscovery={iOS}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: "block", md: "none" },
                            "& .MuiDrawer-paper": {
                                top: HEADER_HEIGHT_MOBILE,
                                width: DRAWER_WIDTH_EXPANDED,
                                height: `calc(100% - ${HEADER_HEIGHT_MOBILE}px)`,
                                borderRadius: 0,
                            },
                        }}
                    >
                        {sidebar}
                    </SwipeableDrawer>

                    <Drawer
                        variant="permanent"
                        open
                        sx={{
                            display: { xs: "none", md: "block" },
                            "& .MuiDrawer-paper": {
                                top: HEADER_HEIGHT_DESKTOP,
                                width: drawerWidth,
                                height: `calc(100% - ${HEADER_HEIGHT_DESKTOP}px)`,
                                border: 0,
                                borderRadius: 0,
                                overflowX: "hidden",
                                transition: "width 200ms ease",
                            },
                        }}
                    >
                        {sidebar}
                    </Drawer>
                </Box>

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        width: { md: `calc(100% - ${drawerWidth}px)` },
                        px: { xs: 2, sm: 3, lg: 4 },
                        py: { xs: 2.5, md: 3.5 },
                        bgcolor: "background.default",
                        transition: "width 200ms ease",
                    }}
                >
                    <Box sx={{ width: "100%", maxWidth: 1540, mx: "auto" }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
