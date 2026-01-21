import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import axios from "axios";
import NProgress from "nprogress";
import { router } from "@inertiajs/react";
import ProviderWrapper from "@/app/ProviderWrapper";
import "@/config"; // Load fonts
import "./styles/app.css";
import "nprogress/nprogress.css";

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
    resolve: (name) => {
        // Import from both old Pages and new features structure
        const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
        const features = import.meta.glob("./features/**/pages/**/*.jsx", {
            eager: true,
        });
        const publicPages = import.meta.glob("./pages/public/*.jsx", {
            eager: true,
        });

        // Map feature paths: "features/auth" -> "Auth"
        const featureMap = {
            // Auth
            "Auth/Login": "./features/auth/pages/Login.jsx",
            "Auth/Register": "./features/auth/pages/Register.jsx",
            "Auth/ForgotPassword": "./features/auth/pages/ForgotPassword.jsx",
            "Auth/ResetPassword": "./features/auth/pages/ResetPassword.jsx",

            // Dashboard
            Dashboard: "./features/dashboard/pages/Dashboard.jsx",

            // Course Builder
            "Instructor/Program/Manage":
                "./features/course-builder/pages/Builder.jsx",

            // Learning Player / Student (Course Player)
            "Student/CoursePlayer":
                "./features/course-player/pages/LectureView.jsx", // Main Course Player
            "Student/Assessments":
                "./features/course-player/pages/Assessments.jsx",
            "Student/Certificates":
                "./features/course-player/pages/Certificates.jsx",
            "Student/Profile": "./features/course-player/pages/Profile.jsx",
            "Student/Quiz/Take": "./features/quizzes/pages/Take.jsx",
            "Student/Quiz/Results": "./features/quizzes/pages/Results.jsx",

            // Instructor Features
            "Instructor/Programs/Index": "./features/programs/pages/Index.jsx",
            "Instructor/Programs/Detail":
                "./features/programs/pages/Detail.jsx",
            "Instructor/Programs/Show": "./features/programs/pages/Show.jsx",
            "Instructor/Program/ChangeRequests":
                "./features/programs/pages/ChangeRequests.jsx",

            // Note: Instructor Quiz pages removed - now handled by Course Builder

            "Instructor/Gradebook/Index":
                "./features/gradebook/pages/Index.jsx",
            "Instructor/Gradebook": "./features/gradebook/pages/Detail.jsx",

            "Instructor/Students/Index": "./features/students/pages/Index.jsx",
            "Instructor/Students/Detail":
                "./features/students/pages/Detail.jsx",
            "Instructor/Students/Show": "./features/students/pages/Show.jsx",

            "Instructor/Announcements/Index":
                "./features/announcements/pages/Index.jsx",
            "Instructor/Announcements/Create":
                "./features/announcements/pages/Create.jsx",

            "Instructor/EnrollmentRequests/Index":
                "./features/enrollments/pages/Index.jsx",

            // Note: Instructor Content pages removed - now handled by Course Builder

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

            // Student Features (Extensions)
            "Student/Assignments/View":
                "./features/assignments/pages/student/View.jsx",
            "Student/Practicum/Index":
                "./features/practicum/pages/student/Index.jsx",
            "Student/Practicum/Upload":
                "./features/practicum/pages/student/Upload.jsx",
            "Student/Programs/Index":
                "./features/course-player/pages/Programs/Index.jsx",
            // Note: Student/Programs/Show removed - backend now renders CoursePlayer directly

            // Rubrics
            "Rubrics/Index": "./features/rubrics/pages/Index.jsx",
            "Rubrics/Form": "./features/rubrics/pages/Form.jsx",
        };

        // Map Public paths
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

        // Admin & SuperAdmin are handled via dynamic check or mapped here
        // Since Admin is large, we check if the file exists in features/admin
        if (name.startsWith("Admin/")) {
            const adminPath = `./features/admin/pages/${name.replace("Admin/", "")}.jsx`;
            if (features[adminPath]) {
                return features[adminPath];
            }
        }

        if (name.startsWith("SuperAdmin/")) {
            const superAdminPath = `./features/super-admin/pages/${name.replace("SuperAdmin/", "")}.jsx`;
            if (features[superAdminPath]) {
                return features[superAdminPath];
            }
        }

        // Try mapped feature path first
        if (featureMap[name] && features[featureMap[name]]) {
            return features[featureMap[name]];
        }
        // Try mapped public path
        if (publicMap[name] && publicPages[publicMap[name]]) {
            return publicPages[publicMap[name]];
        }

        // Fallback to old Pages structure
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            console.error(`Page not found: ${name}`);
            // Return a simple fallback component
            return { default: () => <div>Page not found: {name}</div> };
        }

        return page;
    },
    setup({ el, App, props }) {
        // Extract user from Inertia's initial page props
        const initialUser = props.initialPage?.props?.auth?.user || null;

        // Note: DO NOT set/overwrite the csrftoken cookie here!
        // Django sets the cookie and the axios interceptor reads from it.
        // Overwriting it with different tokens (from props/meta) breaks CSRF validation.

        createRoot(el).render(
            <ProviderWrapper initialUser={initialUser}>
                <App {...props} />
            </ProviderWrapper>,
        );
    },
    progress: false, // We're using NProgress instead
});
