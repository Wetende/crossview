import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
} from "@mui/material";
import { PanelSidebar } from "@/components";
import { COURSE_BUILDER_SIDEBAR_WIDTH } from "../constants/layout";

export default function SidebarLayout({
    sidebarTitle,
    menuItems,
    activeSection,
    onSectionChange,
    children,
}) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                height: "100%",
                width: "100%",
                flex: "1 1 auto",
                alignItems: "stretch",
                overflow: "hidden",
                minWidth: 0,
                minHeight: 0,
            }}
        >
            <PanelSidebar
                title={sidebarTitle}
                width={{ xs: "100%", md: COURSE_BUILDER_SIDEBAR_WIDTH }}
                sx={{
                    height: { xs: "auto", md: "100%" },
                    borderRight: { xs: 0, md: 1 },
                    borderBottom: { xs: 1, md: 0 },
                    borderColor: "divider",
                }}
                contentSx={{
                    overflowX: { xs: "auto", md: "visible" },
                }}
            >
                <List
                    disablePadding
                    sx={{
                        display: { xs: "flex", md: "block" },
                        gap: { xs: 1, md: 0 },
                        minWidth: 0,
                    }}
                >
                    {menuItems.map((section) => {
                        const Icon = section.icon;
                        const selected = activeSection === section.value;
                        return (
                            <ListItemButton
                                key={section.value}
                                selected={selected}
                                onClick={() =>
                                    onSectionChange?.(section.value)
                                }
                                sx={{
                                    minHeight: 50,
                                    minWidth: { xs: 190, md: "auto" },
                                    px: 1.5,
                                    mb: { xs: 0, md: 0.75 },
                                    borderRadius: 0,
                                    color: selected
                                        ? "primary.main"
                                        : "text.secondary",
                                    "&.Mui-selected": {
                                        bgcolor: "background.paper",
                                        color: "primary.main",
                                        fontWeight: 700,
                                    },
                                    "&.Mui-selected:hover": {
                                        bgcolor: "background.paper",
                                    },
                                    "&:hover": {
                                        bgcolor: "rgba(255, 255, 255, 0.55)",
                                    },
                                }}
                            >
                                {Icon && (
                                    <ListItemIcon
                                        sx={{ minWidth: 34, color: "inherit" }}
                                    >
                                        <Icon fontSize="small" />
                                    </ListItemIcon>
                                )}
                                <ListItemText
                                    primary={section.label}
                                    primaryTypographyProps={{
                                        fontSize: 17,
                                        fontWeight: selected ? 700 : 500,
                                        letterSpacing: 0,
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </PanelSidebar>
            <Box
                sx={{
                    flex: "1 1 auto",
                    overflowY: "auto",
                    display: "flex",
                    justifyContent: "center",
                    p: { xs: 2, md: 5 },
                    minWidth: 0,
                    minHeight: 0,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: "100%",
                        maxWidth: 640,
                        alignSelf: "flex-start",
                        bgcolor: "background.paper",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        overflow: "hidden",
                    }}
                >
                    {children}
                </Paper>
            </Box>
        </Box>
    );
}
