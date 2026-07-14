import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DripEditor from "./DripEditor";

const curriculum = [
    {
        id: 10,
        title: "Module 1",
        type: "Module",
        unlockAfterDays: null,
        unlockDate: null,
        children: [
            {
                id: 11,
                title: "Lesson 1",
                type: "Session",
                unlockAfterDays: null,
                unlockDate: null,
                children: [],
            },
        ],
    },
    {
        id: 20,
        title: "Module 2",
        type: "Module",
        unlockAfterDays: null,
        unlockDate: null,
        children: [
            {
                id: 21,
                title: "Lesson 2",
                type: "Session",
                unlockAfterDays: null,
                unlockDate: null,
                children: [],
            },
        ],
    },
];

describe("DripEditor", () => {
    it("saves relative drip schedules for modules and lessons", async () => {
        const onSave = vi.fn((payload, callbacks) => callbacks.onFinish());

        render(
            <DripEditor
                program={{ dripEnabled: false, dripMode: "none" }}
                curriculum={curriculum}
                onSave={onSave}
            />,
        );

        fireEvent.click(screen.getByLabelText("Enable Drip"));
        fireEvent.click(screen.getByLabelText("Enable schedule for Module 2"));
        fireEvent.change(screen.getByLabelText("Unlock Module 2 after days"), {
            target: { value: "7" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Save Schedule" }));

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave.mock.calls[0][0]).toEqual({
            drip_enabled: true,
            drip_mode: "relative",
            drip_schedule: [
                { node_id: 10, unlock_after_days: null, unlock_date: null },
                { node_id: 11, unlock_after_days: null, unlock_date: null },
                { node_id: 20, unlock_after_days: 7, unlock_date: null },
                { node_id: 21, unlock_after_days: null, unlock_date: null },
            ],
        });
    });

    it("saves absolute date schedules when the course is in absolute drip mode", async () => {
        const onSave = vi.fn((payload, callbacks) => callbacks.onFinish());
        const absoluteCurriculum = [
            {
                ...curriculum[0],
                unlockDate: "2026-08-01T00:00:00+00:00",
            },
        ];

        render(
            <DripEditor
                program={{ dripEnabled: true, dripMode: "absolute" }}
                curriculum={absoluteCurriculum}
                onSave={onSave}
            />,
        );

        fireEvent.change(screen.getByLabelText("Unlock Module 1 on date"), {
            target: { value: "2026-08-08" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Save Schedule" }));

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave.mock.calls[0][0]).toMatchObject({
            drip_enabled: true,
            drip_mode: "absolute",
            drip_schedule: [
                { node_id: 10, unlock_after_days: null, unlock_date: "2026-08-08" },
                { node_id: 11, unlock_after_days: null, unlock_date: null },
            ],
        });
    });
});
