import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import ClassroomLayout from "../layouts/ClassroomLayout";
import CourseSidebar from "../components/Navigation/CourseSidebar";
import StudyPanel from "../components/Tools/StudyPanel";
import Whiteboard from "../components/Stage/Whiteboard";
import CourseOverview from "../components/Stage/CourseOverview";
import { Box, Button, Typography } from "@mui/material";
import PlayerSupportStrip from "../components/PlayerSupportStrip";
import UnitCompletionView from "../components/Stage/UnitCompletionView";

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
}) => {
    // Local State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDiscussionsOpen, setIsDiscussionsOpen] = useState(false);
    const [currentVideoTimestamp, setCurrentVideoTimestamp] = useState(null);

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
            onClose={() => setIsDiscussionsOpen(false)}
        />
    );

    const isOverview = activeView === "overview";
    const isUnitSummary = activeView === "unit_summary";

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

            {!isOverview && !isUnitSummary && instructor?.id && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mb: 1.5,
                    }}
                >
                    <Button
                        component={Link}
                        href={`/messages/new/?recipient_id=${instructor.id}`}
                        variant="outlined"
                        size="small"
                    >
                        Message Instructor
                    </Button>
                </Box>
            )}

            <PlayerSupportStrip
                gamification={enrollment?.gamification}
                classroom={enrollment?.googleClassroom}
            />

            {/* Main Stage */}
            {isOverview ? (
                <CourseOverview
                    program={program}
                    enrollment={enrollment}
                    resumeUrl={resumeUrl}
                    curriculum={curriculum}
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
                />
            ) : (
                <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        Select a lesson from the curriculum to start learning.
                    </Typography>
                </Box>
            )}
        </ClassroomLayout>
    );
};

export default LectureView;
