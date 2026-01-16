import React from 'react';
import { router } from '@inertiajs/react';
import { Box } from '@mui/material';
import LessonHeader from './LessonHeader';
import SessionControl from './SessionControl';
import VideoRenderer from '../Renderers/VideoRenderer';
import TextRenderer from '../Renderers/TextRenderer';
import QuizRenderer from '../Renderers/QuizRenderer';
import AssignmentRenderer from '../Renderers/AssignmentRenderer';

const Whiteboard = ({ node, prevNode, nextNode, courseId, isCompleted = false }) => {
    if (!node) return null;

    const handleNavigate = (destination) => {
        router.visit(`/student/programs/${courseId}/session/${destination.id}/`);
    };

    const handleComplete = () => {
        // POST to mark complete
        router.post(`/student/programs/${courseId}/session/${node.id}/`, {
            mark_complete: true
        }, {
            preserveScroll: true,
            only: ['isCompleted', 'curriculum']
        });
    };

    const renderContent = () => {
        // Normalize type from various property sources
        const type = (node.type || node.nodeType || 'lesson').toLowerCase();
        const lessonType = (node.properties?.lesson_type || node.lessonType || '').toLowerCase();

        // 1. Quiz
        if (type === 'quiz' || lessonType === 'quiz') {
            return (
                <QuizRenderer 
                    node={node} 
                    enrollmentId={courseId}
                    onComplete={handleComplete} 
                />
            );
        }

        // 2. Assignment
        if (type === 'assignment' || lessonType === 'assignment') {
            return (
                <AssignmentRenderer 
                    node={node} 
                    enrollmentId={courseId}
                    onSubmit={handleComplete} 
                />
            );
        }

        // 3. Video
        if (type === 'video_lesson' || lessonType === 'video' || lessonType === 'video_lesson') {
            return <VideoRenderer url={node.properties?.video_url} />;
        }

        // 4. Text (Default) - render HTML content
        return (
            <TextRenderer 
                title={node.title} 
                content={node.properties?.content || node.contentHtml || ''} 
            />
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {/* Header: Type Label + Title */}
            <LessonHeader 
                title={node.title} 
                node={node}
            />
            
            {/* Content Area */}
            <Box sx={{ flexGrow: 1 }}>
                {renderContent()}
            </Box>

            {/* Footer Navigation */}
            <SessionControl 
                prevNode={prevNode}
                nextNode={nextNode}
                isCompleted={isCompleted} 
                onComplete={handleComplete}
                onNavigate={handleNavigate}
            />
        </Box>
    );
};

export default Whiteboard;
