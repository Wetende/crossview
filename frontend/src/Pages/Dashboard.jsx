import { Grid, Typography } from "@mui/material";
import {
    IconBook,
    IconUsers,
    IconCertificate,
    IconTrendingUp,
} from "@tabler/icons-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Dashboard Page - Main landing page after login
 */
export default function Dashboard({ stats = {} }) {
    const { user } = useAuth();

    const summaryCards = [
        {
            title: "Total Programs",
            value: stats.programs || 0,
            icon: <IconBook size={24} />,
            color: "primary",
            trend: stats.programsTrend,
        },
        {
            title: "Active Students",
            value: stats.students || 0,
            icon: <IconUsers size={24} />,
            color: "secondary",
            trend: stats.studentsTrend,
        },
        {
            title: "Certificates Issued",
            value: stats.certificates || 0,
            icon: <IconCertificate size={24} />,
            color: "success",
            trend: stats.certificatesTrend,
        },
        {
            title: "Completion Rate",
            value: `${stats.completionRate || 0}%`,
            icon: <IconTrendingUp size={24} />,
            color: "info",
            trend: stats.completionTrend,
        },
    ];

    return (
        <DashboardLayout>
            <PageHeader
                title={`Welcome back, ${user?.first_name || "User"}!`}
                subtitle="Here's what's happening with your learning platform today."
            />

            <Grid container spacing={3}>
                {summaryCards.map((card, index) => (
                    <Grid item xs={12} sm={6} lg={3} key={index}>
                        <SummaryCard
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            color={card.color}
                            trend={card.trend}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Additional dashboard content can be added here */}
        </DashboardLayout>
    );
}
