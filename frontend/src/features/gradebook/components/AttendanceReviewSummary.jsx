import { useEffect, useMemo, useState } from "react";
import { Alert, Button } from "@mui/material";

import { workspaceApi } from "@/features/google-workspace/api/workspaceApi";

export default function AttendanceReviewSummary() {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        let active = true;
        workspaceApi
            .attendanceSessions()
            .then((result) => {
                if (active) setSessions(result.results || []);
            })
            .catch(() => {
                // The Gradebook remains the error and recovery surface.
            });
        return () => {
            active = false;
        };
    }, []);

    const review = useMemo(() => {
        const candidates = sessions
            .map((session) => ({
                ...session,
                reviewCount:
                    Number(session.attendanceCounts?.needsReview || 0) +
                    Number(session.unmatchedAttendanceCount || 0),
            }))
            .filter((session) => session.reviewCount > 0);
        return {
            total: candidates.reduce(
                (sum, session) => sum + session.reviewCount,
                0,
            ),
            first: candidates[0],
        };
    }, [sessions]);

    if (!review.total || !review.first) return null;

    return (
        <Alert
            severity="warning"
            action={
                <Button
                    color="inherit"
                    href={`/instructor/programs/${review.first.courseId}/gradebook/?view=attendance&session=${review.first.nodeId}`}
                >
                    Review
                </Button>
            }
        >
            {review.total} attendance record{review.total === 1 ? "" : "s"} need
            review.
        </Alert>
    );
}
