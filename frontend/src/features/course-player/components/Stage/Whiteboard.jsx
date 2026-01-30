import React, { useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Box } from '@mui/material';
import LessonHeader from './LessonHeader';
import SessionControl from './SessionControl';
import BlockRenderer from '../Renderers/BlockRenderer';
import VideoRenderer from '../Renderers/VideoRenderer';
import TextRenderer from '../Renderers/TextRenderer';
import QuizRenderer from '../Renderers/QuizRenderer';
import AssignmentRenderer from '../Renderers/AssignmentRenderer';

const Whiteboard = ({ node, prevNode, nextNode, courseId, isCompleted = false, onVideoProgress }) => {
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

    // Check if node has content blocks (new multi-block model) - memoized for performance
    const blocks = node?.blocks || [];
    const hasBlocks = useMemo(() => blocks.length > 0, [blocks]);

    const renderBlocks = () => {
        return blocks.map((block) => (
            <BlockRenderer 
                key={block.id}
                block={block}
                enrollmentId={courseId}
                nodeId={node.id}
                onComplete={handleComplete}
                onVideoProgress={onVideoProgress}
            />
        ));
    };

    const renderLegacyContent = () => {
        // Fallback: Normalize type from various property sources
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
            return <VideoRenderer url={node.properties?.video_url} onProgress={onVideoProgress} />;
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
                {hasBlocks ? renderBlocks() : renderLegacyContent()}
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

