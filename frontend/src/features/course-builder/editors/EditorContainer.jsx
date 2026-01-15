import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';
import ContentEditor from './ContentEditor';
import QuizEditor from './QuizEditor';
import AssignmentEditor from './AssignmentEditor';

function DisabledFeatureMessage({ feature }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderStyle: 'dashed'
            }}
        >
            <BlockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
                {feature} Disabled
            </Typography>
            <Typography variant="body2" color="text.secondary">
                This feature is not enabled for this program's blueprint.
                Contact your administrator to enable it.
            </Typography>
        </Paper>
    );
}

export default function EditorContainer({ node, onSave, blueprint }) {
    // Determine the type of the node/lesson to choose the correct editor
    // Normalize type string: 'Quiz' -> 'quiz', 'Assignment' -> 'assignment'
    const type = (node.type || node.node_type || '').toLowerCase();
    const lessonType = (node.properties?.lesson_type || '').toLowerCase();

    // Get feature flags from blueprint (with defaults)
    const featureFlags = blueprint?.featureFlags || {
        quizzes: true,
        assignments: true,
        practicum: false,
        portfolio: false,
        gamification: false
    };

    // Section/Module types are edited inline in the sidebar, not here
    if (type === 'module' || type === 'section' || type === 'unit' || type === 'chapter') {
        return null;
    }

    if (type === 'quiz' || lessonType === 'quiz') {
        if (!featureFlags.quizzes) {
            return <DisabledFeatureMessage feature="Quizzes" />;
        }
        return <QuizEditor node={node} onSave={onSave} />;
    }

    if (type === 'assignment' || lessonType === 'assignment') {
        if (!featureFlags.assignments) {
            return <DisabledFeatureMessage feature="Assignments" />;
        }
        return <AssignmentEditor node={node} onSave={onSave} />;
    }

    // Default to Content Editor for 'Lesson' type (text, video, live_class, etc.)
    return <ContentEditor node={node} onSave={onSave} blueprint={blueprint} />;
}
