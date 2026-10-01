import { Head } from "@inertiajs/react";
import { Stack, Typography } from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import QuestionLibraryWorkspace from "../../components/QuestionLibraryWorkspace";

/**
 * Instructor Question Library: course banks, the instructor's own library
 * and shared banks in one place.
 */
export default function QuestionLibraryIndex({
    banks = [],
    programs = [],
    categories = [],
    canCreateShared = false,
    role = "instructor",
    filters = {},
}) {
    return (
        <DashboardLayout role={role} breadcrumbs={[{ label: "Question Library" }]}>
            <Head title="Question Library" />
            <Stack spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Question Library
                </Typography>
                <Typography color="textSecondary" sx={{ maxWidth: 760 }}>
                    Reuse questions across every course you teach. Course banks belong to one
                    course, your library follows you into any course, and shared banks are
                    managed by administrators for everyone.
                </Typography>
            </Stack>
            <QuestionLibraryWorkspace
                banks={banks}
                programs={programs}
                categories={categories}
                canCreateShared={canCreateShared}
                initialBankId={filters.bank}
            />
        </DashboardLayout>
    );
}
