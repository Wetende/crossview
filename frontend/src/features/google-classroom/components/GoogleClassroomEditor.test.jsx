import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GoogleClassroomEditor from "./GoogleClassroomEditor";
import { classroomApi } from "../api/classroomApi";


vi.mock("../api/classroomApi", () => ({
    classroomApi: {
        linkStatus: vi.fn(),
        connect: vi.fn(),
        courses: vi.fn(),
        createCourse: vi.fn(),
        linkCourse: vi.fn(),
        unlinkCourse: vi.fn(),
        disconnect: vi.fn(),
        previewRoster: vi.fn(),
        applyRoster: vi.fn(),
        publishResources: vi.fn(),
        previewSync: vi.fn(),
        syncNow: vi.fn(),
        history: vi.fn(),
    },
}));

const program = {
    id: 42,
    name: "Portable Course",
    googleClassroom: {
        available: true,
        publishableResources: [
            { localType: "lesson", localId: "9", title: "Introduction" },
        ],
    },
};

describe("GoogleClassroomEditor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("starts with narrow course authorization", async () => {
        classroomApi.linkStatus.mockResolvedValue({
            configurationAvailable: true,
            connection: { connected: false, grantedCapabilities: [] },
            link: { connected: false },
        });
        classroomApi.connect.mockResolvedValue({});

        render(<GoogleClassroomEditor program={program} />);
        fireEvent.click(
            await screen.findByRole("button", {
                name: "Connect Google teacher account",
            }),
        );

        await waitFor(() => {
            expect(classroomApi.connect).toHaveBeenCalledWith({
                capabilities: ["course_manage"],
                returnTo: "/instructor/programs/42/manage/?tab=classroom",
            });
        });
    });

    it("requests roster scopes only when the teacher enables roster sync", async () => {
        classroomApi.linkStatus.mockResolvedValue({
            configurationAvailable: true,
            connection: {
                connected: true,
                googleEmail: "teacher@example.test",
                grantedCapabilities: ["course_read", "course_manage"],
            },
            link: {
                connected: true,
                name: "Remote Course",
                needsActivation: false,
                enrollmentCode: "JOIN42",
            },
        });
        classroomApi.connect.mockResolvedValue({});

        render(<GoogleClassroomEditor program={program} />);
        fireEvent.click(
            await screen.findByRole("button", { name: "Preview roster" }),
        );

        await waitFor(() => {
            expect(classroomApi.connect).toHaveBeenCalledWith({
                capabilities: ["roster_read", "roster_manage"],
                returnTo: "/instructor/programs/42/manage/?tab=classroom",
            });
        });
        expect(classroomApi.previewRoster).not.toHaveBeenCalled();
    });
});
