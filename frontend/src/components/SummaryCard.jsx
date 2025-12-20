import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

/**
 * SummaryCard - Displays a metric with title, value, icon, and trend
 *
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {ReactNode} icon - Icon component
 * @param {object} trend - { value: number, label: string }
 * @param {string} color - Color variant: 'primary' | 'secondary' | 'success' | 'warning' | 'info'
 */
export default function SummaryCard({
    title,
    value,
    icon,
    trend,
    color = "primary",
}) {
    const isPositiveTrend = trend?.value >= 0;

    return (
        <Card>
            <CardContent>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                >
                    <Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                        >
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {value}
                        </Typography>

                        {trend && (
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                sx={{ mt: 1 }}
                            >
                                {isPositiveTrend ? (
                                    <IconTrendingUp size={16} color="green" />
                                ) : (
                                    <IconTrendingDown size={16} color="red" />
                                )}
                                <Typography
                                    variant="caption"
                                    color={
                                        isPositiveTrend
                                            ? "success.main"
                                            : "error.main"
                                    }
                                    fontWeight={500}
                                >
                                    {isPositiveTrend ? "+" : ""}
                                    {trend.value}%
                                </Typography>
                                {trend.label && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {trend.label}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>

                    {icon && (
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: `${color}.lighter`,
                                color: `${color}.main`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
