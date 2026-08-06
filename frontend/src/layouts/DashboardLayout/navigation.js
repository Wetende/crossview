import AssignmentIcon from "@mui/icons-material/Assignment";
import CampaignIcon from "@mui/icons-material/Campaign";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import GradingIcon from "@mui/icons-material/Grading";
import LogoutIcon from "@mui/icons-material/Logout";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import QuizIcon from "@mui/icons-material/Quiz";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from "@mui/icons-material/Settings";

export const ROLE_NAVIGATION = {
    student: [
        {
            title: "Main",
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
                {
                    label: "Enrolled Courses",
                    href: "/student/programs/",
                    icon: SchoolIcon,
                },
                {
                    label: "My Assignments",
                    href: "/student/assignments/",
                    icon: AssignmentIcon,
                },
                {
                    label: "My Quizzes",
                    href: "/student/quizzes/",
                    icon: QuizIcon,
                },
            ],
        },
        {
            title: "Communication",
            items: [
                {
                    label: "Messages",
                    href: "/messages/",
                    icon: MailOutlineIcon,
                },
            ],
        },
        {
            title: "Progress",
            items: [
                {
                    label: "My Certificates",
                    href: "/student/certificates/",
                    icon: CardMembershipIcon,
                },
            ],
        },
        {
            title: "Account & Settings",
            items: [
                {
                    label: "Profile",
                    href: "/student/profile/",
                    icon: PersonIcon,
                },
                {
                    label: "My Wishlist",
                    href: "/wishlist/",
                    icon: FavoriteBorderIcon,
                },
                {
                    label: "My Orders",
                    href: "/student/orders/",
                    icon: ReceiptIcon,
                },
                { label: "Settings", href: "/profile/", icon: SettingsIcon },
                { label: "Logout", action: "logout", icon: LogoutIcon },
            ],
        },
    ],
    instructor: [
        {
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
            ],
        },
        {
            title: "Teaching",
            items: [
                {
                    label: "My Programs",
                    href: "/instructor/programs/",
                    icon: SchoolIcon,
                },
                {
                    label: "My Students",
                    href: "/instructor/students/",
                    icon: PeopleIcon,
                },
            ],
        },
        {
            title: "Progress",
            items: [
                {
                    label: "Gradebook",
                    href: "/instructor/gradebook/",
                    icon: GradingIcon,
                },
                {
                    label: "Assignments",
                    href: "/instructor/assignments/",
                    icon: AssignmentIcon,
                },
            ],
        },
        {
            title: "Communication",
            items: [
                {
                    label: "Announcements",
                    href: "/instructor/announcements/",
                    icon: CampaignIcon,
                },
                {
                    label: "Messages",
                    href: "/messages/",
                    icon: MailOutlineIcon,
                },
            ],
        },
        {
            title: "Review",
            items: [
                {
                    label: "Rubrics",
                    href: "/rubrics/",
                    icon: GradingIcon,
                    requiresFeature: "practicum",
                },
                {
                    label: "Practicum Review",
                    href: "/instructor/practicum/",
                    icon: RateReviewIcon,
                    requiresFeature: "practicum",
                },
            ],
        },
        {
            title: "Account & Settings",
            items: [
                { label: "Profile", href: "/profile/", icon: PersonIcon },
                { label: "Settings", href: "/profile/", icon: SettingsIcon },
                { label: "Logout", action: "logout", icon: LogoutIcon },
            ],
        },
    ],
    admin: [
        {
            items: [
                {
                    label: "Dashboard",
                    href: "/dashboard/",
                    icon: DashboardIcon,
                },
            ],
        },
        {
            title: "Academic",
            items: [
                {
                    label: "Programs",
                    href: "/admin/programs/",
                    icon: SchoolIcon,
                },
                {
                    label: "Categories",
                    href: "/admin/program-categories/",
                    icon: CategoryIcon,
                },
                {
                    label: "Rubrics",
                    href: "/rubrics/",
                    icon: GradingIcon,
                    requiresFeature: "practicum",
                },
            ],
        },
        {
            title: "Management",
            items: [
                { label: "Users", href: "/admin/users/", icon: PeopleIcon },
                {
                    label: "Enrollment Leads",
                    href: "/admin/enrollment-leads/",
                    icon: AssignmentIcon,
                },
                {
                    label: "Enrollments",
                    href: "/admin/enrollments/",
                    icon: AssignmentIcon,
                },
                {
                    label: "Certificates",
                    href: "/admin/certificates/",
                    icon: CardMembershipIcon,
                },
                {
                    label: "Certificate Templates",
                    href: "/admin/certificate-templates/",
                    icon: CardMembershipIcon,
                },
            ],
        },
        {
            title: "Commerce",
            items: [
                {
                    label: "Orders",
                    href: "/admin/commerce/orders/page/",
                    icon: PaymentsIcon,
                },
            ],
        },
        {
            title: "Communication",
            items: [
                {
                    label: "Announcements",
                    href: "/admin/announcements/",
                    icon: CampaignIcon,
                },
                {
                    label: "Messages",
                    href: "/messages/",
                    icon: MailOutlineIcon,
                },
            ],
        },
        {
            title: "Settings",
            items: [
                {
                    label: "General",
                    href: "/admin/settings/",
                    icon: SettingsIcon,
                    requiresCapability: "showAdminSettings",
                },
            ],
        },
    ],
};

export const filterNavigation = (navigation, platform) =>
    navigation
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
                if (
                    item.requiresCapability &&
                    platform?.capabilities?.[item.requiresCapability] === false
                ) {
                    return false;
                }

                if (!item.requiresFeature) {
                    return true;
                }

                return platform?.features?.[item.requiresFeature] === true;
            }),
        }))
        .filter((section) => section.items.length > 0);
