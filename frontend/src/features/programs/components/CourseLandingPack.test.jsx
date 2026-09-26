import { forwardRef } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import CourseContentTabs from "./CourseContentTabs";
import CourseDetailsPanel from "./CourseDetailsPanel";
import CourseIntroMedia from "./CourseIntroMedia";
import InstructorCard from "./InstructorCard";
import MobileEnrollBar from "./MobileEnrollBar";

const player = { props: null };

vi.mock("@/components/LazyReactPlayer", () => ({
    default: forwardRef(function MockPlayer(props, ref) {
        player.props = props;
        return (
            <div data-testid="intro-player" ref={ref}>
                {props.light ? props.playIcon : null}
            </div>
        );
    }),
}));

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("@/hooks/useCurrency", () => ({
    useCurrency: () => ({ formatCurrency: (amount) => `KSh ${amount}` }),
}));

const instructor = {
    name: "Grace Hopper",
    jobTitle: "Principal Engineer",
    bio: "Teaches compilers.\nLoves debugging.",
    linkedinUrl: "https://www.linkedin.com/in/example",
    avatar: null,
};

const facts = {
    certificateOnCompletion: true,
    examBody: "Internal",
    awardType: "Certificate of Completion",
    deliveryMode: "self_paced",
    deliveryModeLabel: "Self-paced",
    accessDurationDays: 90,
    level: "Beginner",
    durationHours: 12,
    lessonCount: 8,
};

describe("overview sections", () => {
    test("renders requirements, audience and the instructor card", () => {
        const { container } = render(
            <CourseContentTabs
                program={{
                    name: "Course",
                    description: "<p>Overview</p>",
                    requirementsHtml:
                        "<ul><li>A laptop</li></ul><script>window.__req = true</script>",
                    audienceHtml: "<p>Career changers</p>",
                    instructor,
                }}
            />,
        );

        const requirements = screen.getByRole("region", { name: "Requirements" });
        expect(within(requirements).getByText("A laptop")).toBeInTheDocument();
        const audience = screen.getByRole("region", { name: "Who this course is for" });
        expect(within(audience).getByText("Career changers")).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Instructor" })).toBeInTheDocument();
        expect(container.querySelector("script")).not.toBeInTheDocument();
    });

    test("hides each section when it has no content", () => {
        render(
            <CourseContentTabs
                program={{
                    name: "Course",
                    description: "<p>Overview</p>",
                    requirementsHtml: "<p></p>",
                    audienceHtml: "",
                    instructor: null,
                }}
            />,
        );

        expect(screen.queryByRole("region", { name: "Requirements" })).not.toBeInTheDocument();
        expect(
            screen.queryByRole("region", { name: "Who this course is for" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole("region", { name: "Instructor" })).not.toBeInTheDocument();
    });
});

describe("InstructorCard", () => {
    test("shows initials, name, job title, bio and a LinkedIn link", () => {
        render(<InstructorCard instructor={instructor} />);

        expect(screen.getByText("GH")).toBeInTheDocument();
        expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
        // The name sits inside the "Instructor" section, not as a sub-heading.
        expect(screen.getAllByRole("heading")).toHaveLength(1);
        expect(screen.getByText("Principal Engineer")).toBeInTheDocument();
        expect(screen.getByText(/Teaches compilers\./)).toBeInTheDocument();
        const link = screen.getByRole("link", { name: /LinkedIn/ });
        expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/example");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    test("omits empty details and unsafe links", () => {
        render(
            <InstructorCard
                instructor={{
                    name: "Instructor",
                    jobTitle: "",
                    bio: "",
                    linkedinUrl: "javascript:alert(1)",
                    avatar: null,
                }}
            />,
        );

        const section = screen.getByRole("region", { name: "Instructor" });
        expect(within(section).getAllByText("Instructor")).toHaveLength(2);
        expect(screen.queryByText("Principal Engineer")).not.toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    test("renders nothing without an instructor", () => {
        const { container } = render(<InstructorCard instructor={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe("CourseDetailsPanel facts", () => {
    test("adds certificate, exam body, award, delivery and access rows", () => {
        render(<CourseDetailsPanel program={{ level: "Beginner", facts }} />);

        expect(screen.getByTestId("course-detail-row-certificate")).toHaveTextContent(
            "On completion (pass required)",
        );
        expect(screen.getByTestId("course-detail-row-exam-body")).toHaveTextContent(
            "Internal",
        );
        expect(screen.getByTestId("course-detail-row-award")).toHaveTextContent(
            "Certificate of Completion",
        );
        expect(screen.getByTestId("course-detail-row-delivery")).toHaveTextContent(
            "Self-paced",
        );
        expect(screen.getByTestId("course-detail-row-access")).toHaveTextContent("90 days");
    });

    test("shows lifetime access and hides empty facts", () => {
        render(
            <CourseDetailsPanel
                program={{
                    facts: {
                        ...facts,
                        certificateOnCompletion: false,
                        examBody: "",
                        awardType: "",
                        deliveryModeLabel: "",
                        accessDurationDays: null,
                    },
                }}
            />,
        );

        expect(screen.getByTestId("course-detail-row-access")).toHaveTextContent(
            "Lifetime access",
        );
        for (const row of ["certificate", "exam-body", "award", "delivery"]) {
            expect(screen.queryByTestId(`course-detail-row-${row}`)).not.toBeInTheDocument();
        }
    });

    test("keeps the original rows when the payload has no facts", () => {
        render(<CourseDetailsPanel program={{ level: "Beginner" }} />);

        expect(screen.queryByTestId("course-detail-row-access")).not.toBeInTheDocument();
        expect(screen.getAllByTestId(/course-detail-row-/)).toHaveLength(4);
    });
});

describe("CourseIntroMedia", () => {
    beforeEach(() => {
        player.props = null;
    });

    test("plays the intro video with the thumbnail as its poster", () => {
        render(
            <CourseIntroMedia
                introVideoUrl="https://youtu.be/dQw4w9WgXcQ"
                thumbnail="/media/thumb.jpg"
                title="Course"
            />,
        );

        expect(screen.getByTestId("intro-player")).toBeInTheDocument();
        expect(player.props.src).toBe("https://youtu.be/dQw4w9WgXcQ");
        expect(player.props.light).toBe("/media/thumb.jpg");
        expect(player.props.controls).toBe(true);
        expect(player.props.previewTabIndex).toBe(-1);
        expect(screen.getByRole("button", { name: "Play intro video" })).toBeInTheDocument();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    test("uses a placeholder preview so the player never loads on page view", () => {
        render(
            <CourseIntroMedia
                introVideoUrl="https://vimeo.com/76979871"
                thumbnail={null}
                title="Course"
            />,
        );

        expect(player.props.light).toBe("/static/images/course-placeholder.svg");
        expect(player.props.playing).toBe(false);
        expect(screen.getByRole("button", { name: "Play intro video" })).toBeInTheDocument();
    });

    test("starts playback when the preview is pressed", () => {
        render(
            <CourseIntroMedia
                introVideoUrl="https://vimeo.com/76979871"
                thumbnail="/media/thumb.jpg"
                title="Course"
            />,
        );

        act(() => player.props.onClickPreview());

        expect(player.props.playing).toBe(true);
    });

    test("falls back to the thumbnail without a playable URL", () => {
        render(
            <CourseIntroMedia
                introVideoUrl="javascript:alert(1)"
                thumbnail="/media/thumb.jpg"
                title="Course"
            />,
        );

        expect(screen.queryByTestId("intro-player")).not.toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Course" })).toHaveAttribute(
            "src",
            "/media/thumb.jpg",
        );
    });

    test("renders nothing without a video or thumbnail", () => {
        const { container } = render(<CourseIntroMedia introVideoUrl="" title="Course" />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe("MobileEnrollBar", () => {
    const baseProps = {
        program: { id: 7, name: "Course", price: 0 },
        enrollmentStatus: null,
        enrollmentMode: "free",
        ctaState: "not_enrolled",
        onBuyNow: vi.fn(),
    };

    test("shows Free and runs the page's enrol handler", () => {
        const onBuyNow = vi.fn();
        render(<MobileEnrollBar {...baseProps} onBuyNow={onBuyNow} />);

        const bar = screen.getByRole("region", { name: "Enrolment" });
        expect(within(bar).getByText("Free")).toBeInTheDocument();
        fireEvent.click(within(bar).getByRole("button", { name: "ENROLL NOW" }));
        expect(onBuyNow).toHaveBeenCalledWith(7);
    });

    test("shows the price beside the paid call to action", () => {
        render(
            <MobileEnrollBar
                {...baseProps}
                program={{ id: 7, name: "Course", price: 1500 }}
                enrollmentMode="paid"
                ctaState="not_enrolled_paid"
            />,
        );

        const bar = screen.getByRole("region", { name: "Enrolment" });
        expect(within(bar).getByText("KSh 1500")).toBeInTheDocument();
        expect(within(bar).getByRole("button", { name: "GET COURSE" })).toBeEnabled();
    });

    test("links enrolled learners back to their course", () => {
        render(
            <MobileEnrollBar
                {...baseProps}
                enrollmentStatus="enrolled"
                ctaState="enrolled"
            />,
        );

        const bar = screen.getByRole("region", { name: "Enrolment" });
        expect(within(bar).queryByText("Free")).not.toBeInTheDocument();
        expect(within(bar).getByText("Course")).toBeInTheDocument();
        expect(within(bar).getByRole("link", { name: "CONTINUE STUDYING" })).toHaveAttribute(
            "href",
            "/student/programs/7/resume/",
        );
    });

    test("disables the call to action while prerequisites are missing", () => {
        render(<MobileEnrollBar {...baseProps} ctaState="prerequisites_required" />);

        expect(screen.getByRole("button", { name: "PREREQUISITES REQUIRED" })).toBeDisabled();
    });

    test("sends learners with a pending payment to their orders", () => {
        render(
            <MobileEnrollBar
                {...baseProps}
                program={{ id: 7, name: "Course", price: 1500 }}
                enrollmentMode="paid"
                ctaState="pending_payment"
            />,
        );

        const bar = screen.getByRole("region", { name: "Enrolment" });
        expect(within(bar).getByText("KSh 1500")).toBeInTheDocument();
        expect(within(bar).getByRole("link", { name: "COMPLETE PAYMENT" })).toHaveAttribute(
            "href",
            "/student/orders/",
        );
    });

    test("shows a pending enrolment request as disabled", () => {
        render(
            <MobileEnrollBar
                {...baseProps}
                enrollmentMode="approval"
                enrollmentStatus="pending"
                ctaState="pending"
            />,
        );

        expect(screen.getByRole("button", { name: "ENROLLMENT PENDING" })).toBeDisabled();
    });

    test("keeps focused content clear of the bar", () => {
        render(<MobileEnrollBar {...baseProps} />);

        const styles = Array.from(document.querySelectorAll("style"))
            .map((node) => node.textContent)
            .join("\n");
        expect(styles).toContain("--course-enroll-bar-height");
        expect(styles).toMatch(/scroll-padding-bottom:\s*var\(--course-enroll-bar-height\)/);
    });
});
