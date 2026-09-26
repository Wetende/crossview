import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import PublicProgramCard from "./PublicProgramCard";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("@/contexts/WishlistContext", () => ({
    useWishlist: () => ({
        wishlist: { items: [] },
        addToWishlist: vi.fn(),
        removeFromWishlist: vi.fn(),
    }),
}));

vi.mock("@/hooks/useCurrency", () => ({
    useCurrency: () => ({ formatCurrency: (amount) => `KSh ${amount}` }),
}));

const catalogueProgram = {
    id: 3,
    name: "Data Analysis",
    publicUrl: "/programs/data-analysis/",
    description: "<p>Work with data.</p>",
    level: "Intermediate",
    duration_hours: 24,
    lecture_count: 10,
    assessment_count: 2,
    price: 0,
};

describe("PublicProgramCard metrics", () => {
    test("shows level, lectures and duration from the catalogue payload", () => {
        render(<PublicProgramCard program={catalogueProgram} />);

        const metrics = screen.getByTestId("course-metric-strip");
        expect(metrics).toHaveTextContent("Intermediate");
        expect(metrics).toHaveTextContent("12 Lectures");
        expect(metrics).toHaveTextContent("24 Hours");
    });

    test("hides metrics the payload does not include", () => {
        render(
            <PublicProgramCard
                program={{
                    id: 4,
                    name: "Wishlist item",
                    publicUrl: "/programs/wishlist-item/",
                }}
            />,
        );

        expect(screen.queryByTestId("course-metric-strip")).not.toBeInTheDocument();
        expect(screen.queryByText(/Lectures?/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Hours?/)).not.toBeInTheDocument();
    });

    test("hides only the missing metric", () => {
        render(
            <PublicProgramCard
                program={{ ...catalogueProgram, level: "", duration_hours: undefined }}
            />,
        );

        const metrics = screen.getByTestId("course-metric-strip");
        expect(metrics).toHaveTextContent("12 Lectures");
        expect(metrics).not.toHaveTextContent("Hour");
        expect(metrics).not.toHaveTextContent("Intermediate");
    });
});
