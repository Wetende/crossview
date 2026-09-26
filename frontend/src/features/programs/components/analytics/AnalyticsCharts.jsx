import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import {
    RANGE_PHRASES,
    formatBucket,
    formatCount,
    humanizeStatus,
    statusColor,
} from "./format";

function useChartTokens() {
    const theme = useTheme();
    return {
        theme,
        tick: { fill: theme.palette.text.secondary, fontSize: 12 },
        grid: theme.palette.divider,
        tooltip: {
            contentStyle: {
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                color: theme.palette.text.primary,
            },
            labelStyle: { color: theme.palette.text.primary, fontWeight: 600 },
            itemStyle: { color: theme.palette.text.primary },
        },
    };
}

const GRANULARITY_UNIT = { day: "day", week: "week", month: "month" };

export function EnrollmentTrendChart({ trend, rangeKey }) {
    const { theme, tick, grid, tooltip } = useChartTokens();
    const points = trend?.points || [];
    const granularity = trend?.granularity || "day";
    const label =
        `New enrollments per ${GRANULARITY_UNIT[granularity] || "day"}: ${formatCount(trend?.total)} ${RANGE_PHRASES[rangeKey] || ""}`.trim();

    if (!points.length) {
        return (
            <Typography
                color="textSecondary"
                sx={{ py: 6, textAlign: "center" }}
            >
                No enrollments in this period.
            </Typography>
        );
    }

    return (
        <Box component="figure" aria-label={label} sx={{ m: 0, height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={points}
                    margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                    title={label}
                    accessibilityLayer
                >
                    <CartesianGrid
                        vertical={false}
                        stroke={grid}
                        strokeDasharray="3 3"
                    />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                            formatBucket(value, granularity)
                        }
                        tick={tick}
                        tickLine={false}
                        axisLine={{ stroke: grid }}
                        minTickGap={24}
                    />
                    <YAxis
                        allowDecimals={false}
                        tick={tick}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        label={{
                            value: "Enrollments",
                            angle: -90,
                            position: "insideLeft",
                            fill: theme.palette.text.secondary,
                            fontSize: 12,
                            style: { textAnchor: "middle" },
                        }}
                    />
                    <Tooltip
                        {...tooltip}
                        cursor={{ stroke: grid }}
                        labelFormatter={(value) =>
                            formatBucket(value, granularity, true)
                        }
                        formatter={(value) => [
                            formatCount(value),
                            "New enrollments",
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        name="New enrollments"
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.12}
                        activeDot={{
                            r: 5,
                            stroke: theme.palette.background.paper,
                            strokeWidth: 2,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
}

export function StatusBreakdownChart({ breakdown = [] }) {
    const { theme, tick, tooltip } = useChartTokens();
    const data = breakdown.map((item) => ({
        ...item,
        label: humanizeStatus(item.status),
    }));

    if (!data.length) {
        return (
            <Typography
                color="textSecondary"
                sx={{ py: 6, textAlign: "center" }}
            >
                No learners yet.
            </Typography>
        );
    }

    const label = `Learners by status: ${data
        .map((item) => `${item.label} ${formatCount(item.count)}`)
        .join(", ")}`;

    return (
        <Box
            component="figure"
            aria-label={label}
            sx={{ m: 0, height: Math.max(120, data.length * 40 + 16) }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                    barCategoryGap={8}
                    title={label}
                    accessibilityLayer
                >
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis
                        type="category"
                        dataKey="label"
                        width={96}
                        tick={tick}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        {...tooltip}
                        cursor={{
                            fill: alpha(theme.palette.text.primary, 0.04),
                        }}
                        formatter={(value) => [formatCount(value), "Learners"]}
                    />
                    <Bar
                        dataKey="count"
                        name="Learners"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                    >
                        {data.map((item) => (
                            <Cell
                                key={item.status}
                                fill={statusColor(theme, item.status)}
                            />
                        ))}
                        <LabelList
                            dataKey="count"
                            position="right"
                            fill={theme.palette.text.primary}
                            fontSize={12}
                            formatter={formatCount}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
