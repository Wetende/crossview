import { Head, usePage } from "@inertiajs/react";

import DashboardLayout from "@/layouts/DashboardLayout";
import AdminDashboard from "../components/AdminDashboard";
import InstructorDashboard from "../components/InstructorDashboard";
import StudentDashboard from "../components/StudentDashboard";

const Dashboard = (props) => {
    const { auth } = usePage().props;
    const role = props.role || auth?.user?.role || "student";
    const firstName =
        auth?.user?.firstName || auth?.user?.email?.split("@")[0] || "Learner";

    const content =
        role === "admin" ? (
            <AdminDashboard
                firstName={firstName}
                recentActivity={props.recentActivity}
                stats={props.stats}
            />
        ) : role === "instructor" ? (
            <InstructorDashboard
                firstName={firstName}
                gradingWorkload={props.gradingWorkload}
                pendingEnrollmentRequests={props.pendingEnrollmentRequests}
                recentSubmissions={props.recentSubmissions}
                stats={props.stats}
            />
        ) : (
            <StudentDashboard
                assignments={props.assignments}
                enrollments={props.enrollments}
                firstName={firstName}
                quizzes={props.quizzes}
                upcomingDeadlines={props.upcomingDeadlines}
            />
        );

    return (
        <DashboardLayout role={role}>
            <Head title="Dashboard" />
            {content}
        </DashboardLayout>
    );
};

export default Dashboard;
