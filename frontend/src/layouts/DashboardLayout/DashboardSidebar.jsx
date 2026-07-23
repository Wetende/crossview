import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Link } from "@inertiajs/react";

const isCurrentRoute = (currentPath, href) =>
    currentPath === href ||
    (href !== "/dashboard/" && Boolean(href) && currentPath.startsWith(href));

const DashboardSidebar = ({
    collapsed,
    currentPath,
    isMobile,
    navigation,
    onLogout,
    onNavigate,
}) => (
    <Box
        sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "#166534",
            color: "#FFFFFF",
        }}
    >
        <Box
            component="nav"
            aria-label="Dashboard navigation"
            sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.25 }}
        >
            {navigation.map((section, sectionIndex) => (
                <Box key={section.title || `section-${sectionIndex}`}>
                    {section.title && (!collapsed || isMobile) ? (
                        <Typography
                            variant="overline"
                            sx={{
                                display: "block",
                                px: 2.5,
                                pt: sectionIndex === 0 ? 0.75 : 1.5,
                                pb: 0.5,
                                color: "rgba(255,255,255,0.58)",
                                fontSize: "0.66rem",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                            }}
                        >
                            {section.title}
                        </Typography>
                    ) : null}

                    {sectionIndex > 0 && collapsed && !isMobile ? (
                        <Divider
                            sx={{
                                mx: 2,
                                my: 1,
                                borderColor: "rgba(255,255,255,0.14)",
                            }}
                        />
                    ) : null}

                    <List disablePadding>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = isCurrentRoute(
                                currentPath,
                                item.href,
                            );
                            const itemProps =
                                item.action === "logout"
                                    ? { component: "button", onClick: onLogout }
                                    : {
                                          component: Link,
                                          href: item.href,
                                          onClick: onNavigate,
                                      };

                            const control = (
                                <ListItemButton
                                    {...itemProps}
                                    selected={active}
                                    aria-current={active ? "page" : undefined}
                                    sx={{
                                        minHeight: 49,
                                        py: 1,
                                        px: collapsed && !isMobile ? 1.5 : 2.5,
                                        justifyContent:
                                            collapsed && !isMobile
                                                ? "center"
                                                : "flex-start",
                                        color: "#FFFFFF",
                                        borderLeft: "4px solid transparent",
                                        borderRadius: 0,
                                        transition:
                                            "background-color 160ms ease, border-color 160ms ease",
                                        "&:hover": {
                                            bgcolor: "rgba(9, 30, 88, 0.34)",
                                        },
                                        "&.Mui-selected": {
                                            bgcolor: "#14532D",
                                            borderLeftColor: "#22C55E",
                                            color: "#FFFFFF",
                                            "&:hover": { bgcolor: "#104527" },
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth:
                                                collapsed && !isMobile ? 0 : 42,
                                            justifyContent: "center",
                                            color: "inherit",
                                        }}
                                    >
                                        <Icon sx={{ fontSize: 22 }} />
                                    </ListItemIcon>
                                    {collapsed && !isMobile ? null : (
                                        <ListItemText
                                            primary={item.label}
                                            slotProps={{
                                                primary: {
                                                    fontSize: "0.93rem",
                                                    fontWeight: active
                                                        ? 700
                                                        : 500,
                                                    letterSpacing: "0.005em",
                                                },
                                            }}
                                        />
                                    )}
                                </ListItemButton>
                            );

                            return (
                                <ListItem
                                    key={item.href || item.label}
                                    disablePadding
                                    sx={{
                                        borderBottom:
                                            "1px solid rgba(255,255,255,0.075)",
                                    }}
                                >
                                    {collapsed && !isMobile ? (
                                        <Tooltip
                                            title={item.label}
                                            placement="right"
                                            arrow
                                        >
                                            {control}
                                        </Tooltip>
                                    ) : (
                                        control
                                    )}
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            ))}
        </Box>

        <Box
            sx={{
                flexShrink: 0,
                px: collapsed && !isMobile ? 1 : 2,
                py: 1.75,
                textAlign: "center",
                borderTop: "1px solid rgba(255,255,255,0.14)",
                bgcolor: "rgba(7, 23, 67, 0.16)",
            }}
        >
            {collapsed && !isMobile ? (
                <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.72)" }}
                >
                    ©{new Date().getFullYear()}
                </Typography>
            ) : (
                <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.72)" }}
                >
                    © {new Date().getFullYear()} LMS
                </Typography>
            )}
        </Box>
    </Box>
);

export default DashboardSidebar;
