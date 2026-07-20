import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import NewConversation from "./NewConversation";

vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <>{children}</>,
}));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    useForm: (initialData) => {
        const [data, setFormData] = useState(initialData);
        return {
            data,
            setData: (key, value) =>
                setFormData((current) => ({ ...current, [key]: value })),
            post: vi.fn(),
            processing: false,
        };
    },
}));

describe("new conversation recipient handoff", () => {
    test("shows the preselected learner email in the recipient field", async () => {
        const recipients = [
            {
                id: 2,
                name: "Peter Student",
                email: "peter@student.com",
            },
        ];
        const view = render(
            <NewConversation recipients={recipients} />,
        );

        view.rerender(
            <NewConversation
                recipients={recipients}
                preselectedRecipientId={2}
            />,
        );

        await waitFor(() => {
            expect(
                screen.getByRole("combobox", { name: /recipient/i }),
            ).toHaveTextContent("Peter Student (peter@student.com)");
        });
    });
});
