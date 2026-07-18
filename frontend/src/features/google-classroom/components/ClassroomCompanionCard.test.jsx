import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ClassroomCompanionCard from "./ClassroomCompanionCard";


describe("ClassroomCompanionCard", () => {
    it("shows enrolled-only join guidance without replacing the course player", () => {
        render(
            <ClassroomCompanionCard
                classroom={{
                    connected: true,
                    membershipStatus: "not_joined",
                    classCode: "JOIN42",
                    alternateLink: "https://classroom.google.com/c/course-1",
                }}
            />,
        );

        expect(screen.getByText("Google Classroom companion")).toBeInTheDocument();
        expect(screen.getByText(/Course enrollment and Classroom membership are separate/)).toBeInTheDocument();
        expect(screen.getByText("JOIN42")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Open Classroom/ })).toHaveAttribute(
            "href",
            "https://classroom.google.com/c/course-1",
        );
    });

    it("renders nothing without a linked companion", () => {
        const { container } = render(
            <ClassroomCompanionCard classroom={{ connected: false }} />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
