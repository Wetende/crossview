import { useRef, useState } from "react";
import { Head } from "@inertiajs/react";
import ClassroomLayout from "../layouts/ClassroomLayout";
import CourseSidebar from "../components/Navigation/CourseSidebar";
import StudyPanel from "../components/Tools/StudyPanel";
import Whiteboard from "../components/Stage/Whiteboard";
import CourseOverview from "../components/Stage/CourseOverview";
import { Box, Typography } from "@mui/material";
import PlayerSupportStrip from "../components/PlayerSupportStrip";
import UnitCompletionView from "../components/Stage/UnitCompletionView";
import { ACTIVITY_TYPES, normalizeActivityType } from "@/lib/activityTypes";

const lessonHasVideo = (node) =>
    Boolean(node) &&
    (normalizeActivityType(node) === ACTIVITY_TYPES.VIDEO ||
        (node.supplements || node.blocks || []).some(
            (block) => String(block?.type || "").toUpperCase() === "VIDEO",
        ));

const LectureView = ({
    program,
    enrollment,
    node,
    curriculum,
    prevNode,
    nextNode,
    isCompleted,
    instructor = null,
    discussions = [],
    notes = [],
    activeView = null,
    resumeUrl = null,
    unitSummary = null,
    announcements = [],
}) => {
    // Local State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
    const [currentVideoTimestamp, setCurrentVideoTimestamp] = useState(null);
    // VideoRenderer assigns a (seconds) => void seek function here.
    const seekRef = useRef(null);

    // Handle video progress updates
    const handleVideoProgress = (state) => {
        // state.playedSeconds contains current playback position
        setCurrentVideoTimestamp(Math.floor(state.playedSeconds));
    };

    // Left Panel - Curriculum Sidebar
    const LeftPanel = (
        <CourseSidebar
            program={program}
            progress={enrollment?.progressPercent || 0}
            curriculum={curriculum || []}
            activeNodeId={node?.id}
            enrollmentId={enrollment?.id}
            activeView={activeView}
        />
    );

    // Right Panel - Discussions/Notes
    const RightPanel = (
        <StudyPanel
            nodeId={node?.id}
            enrollmentId={enrollment?.id}
            discussions={discussions}
            notes={notes}
            currentVideoTimestamp={currentVideoTimestamp}
            onSeek={
                lessonHasVideo(node)
                    ? (seconds) => seekRef.current?.(seconds)
                    : undefined
            }
            onClose={() => setIsDiscussionsOpen(false)}
        />
    );

    const isOverview = activeView === "overview";
    const isUnitSummary = activeView === "unit_summary";
    const isLessonView = !isOverview && !isUnitSummary && Boolean(node);

    const messageInstructorHref =
        isLessonView && instructor?.id
            ? `/messages/new/?recipient_id=${instructor.id}&draft=${encodeURIComponent(
                  `Question about "${node.title}" in ${program?.name || "this course"}:\n\n`,
              )}`
            : null;

    return (
        <ClassroomLayout
            programTitle={program?.name || "Loading Course..."}
            backLink="/dashboard/"
            LeftPanel={LeftPanel}
            RightPanel={isOverview || isUnitSummary ? null : RightPanel}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isDiscussionsOpen={isDiscussionsOpen}
            onToggleDiscussions={() => setIsDiscussionsOpen(!isDiscussionsOpen)}
            messageInstructorHref={messageInstructorHref}
        >
            <Head
                title={
                    isOverview
                        ? `${program?.name || "Course"} - Overview`
                        : isUnitSummary
                          ? `${unitSummary?.title || "Unit"} - Summary`
                          : node?.title || program?.name || "Course Player"
                }
            />

            <PlayerSupportStrip
                gamification={enrollment?.gamification}
            />

            {/* Main Stage */}
            {isOverview ? (
                <CourseOverview
                    program={program}
                    enrollment={enrollment}
                    resumeUrl={resumeUrl}
                    curriculum={curriculum}
                    announcements={announcements}
                />
            ) : isUnitSummary && unitSummary ? (
                <UnitCompletionView unit={unitSummary} />
            ) : node ? (
                <Whiteboard
                    node={node}
                    prevNode={prevNode}
                    nextNode={nextNode}
                    courseId={enrollment?.id}
                    isCompleted={isCompleted}
                    discussions={discussions}
                    onVideoProgress={handleVideoProgress}
                    seekRef={seekRef}
                />
            ) : (
                <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="textSecondary">
                        Select a lesson from the curriculum to start learning.
                    </Typography>
                </Box>
            )}
        </ClassroomLayout>
    );
};

export default LectureView;
