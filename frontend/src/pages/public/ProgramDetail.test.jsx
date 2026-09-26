import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ProgramDetail from "./ProgramDetail";

const { pageProps } = vi.hoisted(() => ({ pageProps: { current: {} } }));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: { post: vi.fn() },
    usePage: () => ({ props: pageProps.current }),
}));
vi.mock("framer-motion", () => ({
    motion: { div: ({ children }) => <div>{children}</div> },
}));
vi.mock("@/components/common/PublicNavbar", () => ({ default: () => null }));
vi.mock("@/components/common/Footer", () => ({ default: () => null }));
vi.mock("@/components/modals", () => ({ CourseDetailsModal: () => null }));
vi.mock("@/features/enrollment-intents/components/EnrollmentIntentDialog", () => ({
    default: () => null,
}));
vi.mock("@/components/LazyReactPlayer", () => ({ default: () => null }));
vi.mock("@/contexts/CartContext", () => ({ useCart: () => ({ addToCart: vi.fn() }) }));
vi.mock("@/contexts/WishlistContext", () => ({
    useWishlist: () => ({
        wishlist: { items: [] },
        addToWishlist: vi.fn(),
        removeFromWishlist: vi.fn(),
    }),
}));

const freeProgram = {
    id: 7,
    name: "Course",
    description: "<p>Overview</p>",
    price: 0,
    priceDisplay: { cardDisplay: "free", effectivePrice: 0 },
};
const paidProgram = {
    ...freeProgram,
    price: 1500,
    priceDisplay: {
        cardDisplay: "price",
        effectivePrice: 1500,
        paymentCollection: "online",
    },
};
const signedIn = { user: { id: 1, email: "learner@example.org", phone: "0700" } };

function renderPage({ auth = { user: null }, ...props }) {
    pageProps.current = { auth, platform: { currencySymbol: "KSh " } };
    return render(<ProgramDetail program={freeProgram} {...props} />);
}

// Controls rendered by the desktop details card, excluding the mobile bar.
function desktopControls(role, name) {
    const bar = screen.queryByRole("region", { name: "Enrolment" });
    return screen
        .queryAllByRole(role, { name })
        .filter((element) => !bar?.contains(element));
}

// The first render pulls in the whole page; allow for a busy test runner.
describe("ProgramDetail calls to action", { timeout: 20000 }, () => {
    beforeEach(() => {
        pageProps.current = {};
    });

    test.each([
        ["free, signed out", {}, "button", "ENROLL NOW"],
        [
            "approval, signed in",
            { auth: signedIn, enrollmentMode: "approval" },
            "button",
            "REQUEST ENROLLMENT",
        ],
        [
            "paid, signed in",
            {
                auth: signedIn,
                program: paidProgram,
                enrollmentMode: "paid",
                ctaState: "not_enrolled_paid",
            },
            "button",
            "GET COURSE - KSh 1,500",
        ],
        [
            "pending payment",
            {
                auth: signedIn,
                program: paidProgram,
                enrollmentMode: "paid",
                ctaState: "pending_payment",
            },
            "link",
            "COMPLETE PAYMENT",
        ],
        [
            "enrolled",
            { auth: signedIn, enrollmentStatus: "enrolled", ctaState: "enrolled" },
            "link",
            "CONTINUE STUDYING",
        ],
    ])("keeps the desktop label for %s", (_, props, role, label) => {
        renderPage(props);

        expect(desktopControls(role, label)).toHaveLength(1);
        expect(screen.getByRole("region", { name: "Enrolment" })).toBeInTheDocument();
    });

    test("keeps the desktop cart button and links", () => {
        renderPage({
            auth: signedIn,
            program: paidProgram,
            enrollmentMode: "paid",
            ctaState: "not_enrolled_paid",
        });

        expect(desktopControls("button", "Add to Cart")).toHaveLength(1);
        const bar = screen.getByRole("region", { name: "Enrolment" });
        expect(within(bar).getByRole("button", { name: "GET COURSE" })).toBeInTheDocument();
    });

    test("links enrolled learners to the same place from both surfaces", () => {
        renderPage({ auth: signedIn, enrollmentStatus: "enrolled", ctaState: "enrolled" });

        for (const link of screen.getAllByRole("link", { name: "CONTINUE STUDYING" })) {
            expect(link).toHaveAttribute("href", "/student/programs/7/resume/");
        }
    });

    test("hides the mobile bar and enrolment actions in a draft preview", () => {
        renderPage({ isPreview: true, builderUrl: "/instructor/programs/7/manage/" });

        expect(screen.queryByRole("region", { name: "Enrolment" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "ENROLL NOW" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to Course Builder" })).toBeInTheDocument();
    });
});
