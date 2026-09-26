import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    afterEach(() => {
        vi.useRealTimers();
    });

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
        // Each row carries only the active mode's field so saved dates are
        // never wiped by a days-mode save (and vice versa).
        expect(onSave.mock.calls[0][0]).toEqual({
            drip_enabled: true,
            drip_mode: "relative",
            drip_schedule: [
                { node_id: 10, unlock_after_days: null },
                { node_id: 11, unlock_after_days: null },
                { node_id: 20, unlock_after_days: 7 },
                { node_id: 21, unlock_after_days: null },
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
        expect(onSave.mock.calls[0][0]).toEqual({
            drip_enabled: true,
            drip_mode: "absolute",
            drip_schedule: [
                { node_id: 10, unlock_date: "2026-08-08" },
                { node_id: 11, unlock_date: null },
            ],
        });
    });

    it("keeps a row switched on when the saved curriculum comes back empty", () => {
        const { rerender } = render(
            <DripEditor
                program={{ id: 5, dripEnabled: true, dripMode: "relative" }}
                curriculum={curriculum}
                onSave={vi.fn()}
            />,
        );

        const rowSwitch = screen.getByLabelText("Enable schedule for Module 2");
        fireEvent.click(rowSwitch);
        expect(rowSwitch).toBeChecked();

        // Autosave stored null for the still-empty row and the redirect
        // delivered a fresh curriculum prop with nulls.
        rerender(
            <DripEditor
                program={{ id: 5, dripEnabled: true, dripMode: "relative" }}
                curriculum={structuredClone(curriculum)}
                onSave={vi.fn()}
            />,
        );

        expect(
            screen.getByLabelText("Enable schedule for Module 2"),
        ).toBeChecked();
    });

    it("keeps a typed value when a refreshed curriculum still has none", () => {
        const { rerender } = render(
            <DripEditor
                program={{ id: 5, dripEnabled: true, dripMode: "relative" }}
                curriculum={curriculum}
                onSave={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByLabelText("Enable schedule for Module 1"));
        fireEvent.change(screen.getByLabelText("Unlock Module 1 after days"), {
            target: { value: "3" },
        });
        rerender(
            <DripEditor
                program={{ id: 5, dripEnabled: true, dripMode: "relative" }}
                curriculum={structuredClone(curriculum)}
                onSave={vi.fn()}
            />,
        );

        expect(screen.getByLabelText("Unlock Module 1 after days")).toHaveValue(
            3,
        );
    });

    it("keeps a field cleared after its save went out when the reply still has the old value", () => {
        vi.useFakeTimers();
        const onSave = vi.fn();
        const program = { id: 5, dripEnabled: true, dripMode: "relative" };
        const { rerender } = render(
            <DripEditor
                program={program}
                curriculum={curriculum}
                onSave={onSave}
            />,
        );

        fireEvent.click(screen.getByLabelText("Enable schedule for Module 1"));
        fireEvent.change(screen.getByLabelText("Unlock Module 1 after days"), {
            target: { value: "5" },
        });
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave.mock.calls[0][0].drip_schedule[0]).toEqual({
            node_id: 10,
            unlock_after_days: 5,
        });

        // The instructor clears the field before the save's reply arrives.
        fireEvent.change(screen.getByLabelText("Unlock Module 1 after days"), {
            target: { value: "" },
        });
        const reply = structuredClone(curriculum);
        reply[0].unlockAfterDays = 5;
        rerender(
            <DripEditor program={program} curriculum={reply} onSave={onSave} />,
        );

        expect(screen.getByLabelText("Unlock Module 1 after days")).toHaveValue(
            null,
        );
        expect(
            screen.getByLabelText("Enable schedule for Module 1"),
        ).toBeChecked();
    });

    it("keeps a row switched off when a refresh still carries its old value", () => {
        const program = { id: 5, dripEnabled: true, dripMode: "relative" };
        const scheduled = structuredClone(curriculum);
        scheduled[1].unlockAfterDays = 7;
        const { rerender } = render(
            <DripEditor program={program} curriculum={scheduled} onSave={vi.fn()} />,
        );

        fireEvent.click(screen.getByLabelText("Enable schedule for Module 2"));
        rerender(
            <DripEditor
                program={program}
                curriculum={structuredClone(scheduled)}
                onSave={vi.fn()}
            />,
        );

        expect(
            screen.getByLabelText("Enable schedule for Module 2"),
        ).not.toBeChecked();
    });

    it("switches off an untouched row that the server cleared", () => {
        const program = { id: 5, dripEnabled: true, dripMode: "relative" };
        const scheduled = structuredClone(curriculum);
        scheduled[1].unlockAfterDays = 7;
        const { rerender } = render(
            <DripEditor program={program} curriculum={scheduled} onSave={vi.fn()} />,
        );
        expect(screen.getByLabelText("Enable schedule for Module 2")).toBeChecked();
        expect(screen.getByLabelText("Unlock Module 2 after days")).toHaveValue(7);

        // Another instructor cleared the schedule.
        rerender(
            <DripEditor
                program={program}
                curriculum={structuredClone(curriculum)}
                onSave={vi.fn()}
            />,
        );

        expect(
            screen.getByLabelText("Enable schedule for Module 2"),
        ).not.toBeChecked();
        expect(screen.getByLabelText("Unlock Module 2 after days")).toHaveValue(
            null,
        );
    });

    it("does not send the other mode's field after switching schedule mode", async () => {
        const onSave = vi.fn((payload, callbacks) => callbacks.onFinish());
        const scheduledCurriculum = [
            { ...curriculum[0], unlockAfterDays: 7, children: [] },
        ];

        render(
            <DripEditor
                program={{ id: 5, dripEnabled: true, dripMode: "relative" }}
                curriculum={scheduledCurriculum}
                onSave={onSave}
            />,
        );

        fireEvent.mouseDown(screen.getByRole("combobox"));
        fireEvent.click(screen.getByRole("option", { name: "Specific Date" }));
        fireEvent.click(screen.getByRole("button", { name: "Save Schedule" }));

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave.mock.calls[0][0]).toEqual({
            drip_enabled: true,
            drip_mode: "absolute",
            drip_schedule: [{ node_id: 10, unlock_date: null }],
        });
    });
});
