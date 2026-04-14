import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import axios from "axios";
import NProgress from "nprogress";
import { router } from "@inertiajs/react";
import ProviderWrapper from "@/app/ProviderWrapper";
import PlatformBranding from "@/components/PlatformBranding";
import "@/config"; // Load fonts
import "./styles/app.css";
import "nprogress/nprogress.css";

const pages = import.meta.glob("./Pages/**/*.jsx");
const features = import.meta.glob(
    ["./features/**/pages/**/*.jsx", "!**/*.test.jsx", "!**/*.spec.jsx"],
);
const publicPages = import.meta.glob("./pages/public/*.jsx");

const featureMap = {
    // Auth
    "Auth/Login": "./features/auth/pages/Login.jsx",
    "Auth/Register": "./features/auth/pages/Register.jsx",
    "Auth/ForgotPassword": "./features/auth/pages/ForgotPassword.jsx",
    "Auth/ResetPassword": "./features/auth/pages/ResetPassword.jsx",

    // Dashboard
    Dashboard: "./features/dashboard/pages/Dashboard.jsx",

    // Course Builder
    "Instructor/Program/Manage": "./features/course-builder/pages/Builder.jsx",

    // Learning Player / Student (Course Player)
    "Student/CoursePlayer": "./features/course-player/pages/LectureView.jsx",
    "Student/Assessments": "./features/course-player/pages/Assessments.jsx",
    "Student/Certificates": "./features/course-player/pages/Certificates.jsx",
    "Student/Profile": "./features/course-player/pages/Profile.jsx",
    "Student/Quiz/Take": "./features/quizzes/pages/Take.jsx",
    "Student/Quiz/Results": "./features/quizzes/pages/Results.jsx",

    // Instructor Features
    "Instructor/Programs/Index": "./features/programs/pages/Index.jsx",
    "Instructor/Programs/Detail": "./features/programs/pages/Detail.jsx",
    "Instructor/Programs/Show": "./features/programs/pages/Show.jsx",
    "Instructor/Program/ChangeRequests":
        "./features/programs/pages/ChangeRequests.jsx",
    "Instructor/Gradebook/Index": "./features/gradebook/pages/Index.jsx",
    "Instructor/Gradebook": "./features/gradebook/pages/Detail.jsx",
    "Instructor/Students/Index": "./features/students/pages/Index.jsx",
    "Instructor/Students/Detail": "./features/students/pages/Detail.jsx",
    "Instructor/Students/Show": "./features/students/pages/Show.jsx",
    "Instructor/Announcements/Index":
        "./features/announcements/pages/Index.jsx",
    "Instructor/Announcements/Create":
        "./features/announcements/pages/Create.jsx",
    "Instructor/EnrollmentRequests/Index":
        "./features/enrollments/pages/Index.jsx",
    "Payments/Checkout": "./features/enrollments/pages/Checkout.jsx",
    "Student/Orders": "./features/enrollments/pages/Orders.jsx",
    "Instructor/Assignments/Global":
        "./features/assignments/pages/instructor/Global.jsx",
    "Instructor/Assignments/Index":
        "./features/assignments/pages/instructor/Index.jsx",
    "Instructor/Assignments/Grade":
        "./features/assignments/pages/instructor/Grade.jsx",
    "Instructor/Assignments/Submissions":
        "./features/assignments/pages/instructor/Submissions.jsx",
    "Instructor/Practicum/Index":
        "./features/practicum/pages/instructor/Index.jsx",
    "Instructor/Practicum/Review":
        "./features/practicum/pages/instructor/Review.jsx",
    "Instructor/Apply": "./features/auth/pages/InstructorApply.jsx",
    "Notifications/Index": "./features/notifications/pages/Index.jsx",

    // Student Features
    "Student/Assignments/View":
        "./features/assignments/pages/student/View.jsx",
    "Student/Practicum/Index": "./features/practicum/pages/student/Index.jsx",
    "Student/Practicum/Upload":
        "./features/practicum/pages/student/Upload.jsx",
    "Student/Programs/Index":
        "./features/course-player/pages/Programs/Index.jsx",

    // Rubrics
    "Assessments/Rubrics/Index":
        "./features/assessments/pages/Rubrics/Index.jsx",
    "Assessments/Rubrics/Create":
        "./features/assessments/pages/Rubrics/Create.jsx",
    "Assessments/Rubrics/Edit":
        "./features/assessments/pages/Rubrics/Edit.jsx",
    "Rubrics/Index": "./features/rubrics/pages/Index.jsx",
    "Rubrics/Form": "./features/rubrics/pages/Form.jsx",

    // Commerce
    "Commerce/Cart": "./features/commerce/pages/Cart.jsx",
    "Commerce/Checkout": "./features/commerce/pages/Checkout.jsx",
    "Commerce/OrderDetail": "./features/commerce/pages/OrderDetail.jsx",
};

const publicMap = {
    "Public/Landing": "./pages/public/Landing.jsx",
    "Public/About": "./pages/public/About.jsx",
    "Public/Contact": "./pages/public/Contact.jsx",
    "Public/Programs": "./pages/public/Programs.jsx",
    "Public/ProgramDetail": "./pages/public/ProgramDetail.jsx",
    "Public/CertificateVerify": "./pages/public/CertificateVerify.jsx",
    "Public/VerifyCertificate": "./pages/public/VerifyCertificate.jsx",
    "Public/Events": "./pages/public/Events.jsx",
    "Public/EventDetail": "./pages/public/EventDetail.jsx",
    Home: "./pages/public/Home.jsx",
};

function resolvePageLoader(name) {
    if (name.startsWith("Admin/")) {
        const adminPath = `./features/admin/pages/${name.replace("Admin/", "")}.jsx`;
        if (features[adminPath]) {
            return features[adminPath];
        }
    }

    if (featureMap[name] && features[featureMap[name]]) {
        return features[featureMap[name]];
    }

    if (publicMap[name] && publicPages[publicMap[name]]) {
        return publicPages[publicMap[name]];
    }

    return pages[`./Pages/${name}.jsx`];
}

// Configure axios for CSRF
// Django is now configured to use Axios defaults: XSRF-TOKEN cookie, X-XSRF-TOKEN header
axios.defaults.withCredentials = true;

// Configure NProgress
NProgress.configure({ showSpinner: false, trickleSpeed: 200, minimum: 0.3 });

// Show progress bar on page transitions
router.on("start", () => NProgress.start());
router.on("finish", () => NProgress.done());

// Create Inertia app
createInertiaApp({
    resolve: async (name) => {
        const pageLoader = resolvePageLoader(name);

        if (!pageLoader) {
            console.error(`Page not found: ${name}`);
            return { default: () => <div>Page not found: {name}</div> };
        }

        return pageLoader();
    },
    setup({ el, App, props }) {
        // Extract user from Inertia's initial page props
        const initialUser = props.initialPage?.props?.auth?.user || null;
        // Extract favicon URL from platform props
        const faviconUrl =
            props.initialPage?.props?.platform?.faviconUrl || null;
        // Extract institution name from platform props for document title
        const platformName =
            props.initialPage?.props?.platform?.institutionName || null;
        // Extract full platform object for dynamic theming
        const platform = props.initialPage?.props?.platform || null;

        // Note: DO NOT set/overwrite the csrftoken cookie here!
        // Django sets the cookie and the axios interceptor reads from it.
        // Overwriting it with different tokens (from props/meta) breaks CSRF validation.

        createRoot(el).render(
            <ProviderWrapper initialUser={initialUser} platform={platform}>
                <PlatformBranding
                    faviconUrl={faviconUrl}
                    platformName={platformName}
                />
                <App {...props} />
            </ProviderWrapper>,
        );
    },
    progress: false, // We're using NProgress instead
});
