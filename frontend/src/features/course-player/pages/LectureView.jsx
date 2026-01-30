import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import ClassroomLayout from '../layouts/ClassroomLayout';
import CourseSidebar from '../components/Navigation/CourseSidebar';
import StudyPanel from '../components/Tools/StudyPanel';
import Whiteboard from '../components/Stage/Whiteboard';
import { Box, Typography } from '@mui/material';

const LectureView = ({ 
    program, 
    enrollment, 
    node, 
    curriculum, 
    progress, 
    prevNode, 
    nextNode, 
    isCompleted,
    discussions = [],
    notes = []
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

    return (
        <ClassroomLayout 
            programTitle={program?.name || 'Loading Course...'}
            backLink="/dashboard/"
            LeftPanel={LeftPanel}
            RightPanel={RightPanel}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isDiscussionsOpen={isDiscussionsOpen}
            onToggleDiscussions={() => setIsDiscussionsOpen(!isDiscussionsOpen)}
        >
            <Head title={node?.title || program?.name || 'Course Player'} />
            
            {/* Main Stage */}
            {node ? (
                <Whiteboard 
                    node={node} 
                    prevNode={prevNode}
                    nextNode={nextNode}
                    courseId={enrollment?.id}
                    isCompleted={isCompleted}
                    onVideoProgress={handleVideoProgress}
                />
            ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        Select a lesson from the curriculum to start learning.
                    </Typography>
                </Box>
            )}
        </ClassroomLayout>
    );
};

export default LectureView;

