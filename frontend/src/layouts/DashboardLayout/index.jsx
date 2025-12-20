import { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useConfig } from "@/contexts/ConfigContext";
import { DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED } from "@/config";

/**
 * DashboardLayout - Main application shell
 * Features collapsible sidebar and responsive header
 */
export default function DashboardLayout({ children }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const { sidebarCollapsed, toggleSidebar } = useConfig();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSidebarToggle = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            toggleSidebar();
        }
    };

    const handleMobileClose = () => {
        setMobileOpen(false);
    };

    const drawerWidth = sidebarCollapsed
        ? DRAWER_WIDTH_COLLAPSED
        : DRAWER_WIDTH;

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar
                open={!sidebarCollapsed}
                mobileOpen={mobileOpen}
                onMobileClose={handleMobileClose}
                drawerWidth={drawerWidth}
                isMobile={isMobile}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    ml: { md: `${drawerWidth}px` },
                    transition: theme.transitions.create(["margin", "width"], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Header
                    onMenuClick={handleSidebarToggle}
                    sidebarOpen={!sidebarCollapsed}
                    isMobile={isMobile}
                />

                <Box
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, sm: 3 },
                        backgroundColor: "background.default",
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
