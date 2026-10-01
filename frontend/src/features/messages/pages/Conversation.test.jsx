import { useState } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import Conversation from "./Conversation";

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
            reset: vi.fn(),
            processing: false,
        };
    },
}));

const conversation = {
    id: 3,
    otherUser: { id: 7, name: "Grace Mentor", email: "grace@example.com" },
};

describe("conversation draft handoff", () => {
    test("seeds the reply box from a draft handed over by the course player", () => {
        const draft = 'Question about "Deployment models" in DevOps:\n\n';
        render(<Conversation conversation={conversation} draftContent={draft} />);

        expect(screen.getByRole("textbox", { name: /reply/i })).toHaveValue(draft);
    });

    test("starts with an empty reply box without a draft", () => {
        render(<Conversation conversation={conversation} />);

        expect(screen.getByRole("textbox", { name: /reply/i })).toHaveValue("");
    });
});
