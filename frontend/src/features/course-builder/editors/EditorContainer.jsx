import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';
import ContentEditor from './ContentEditor';
import AssessmentEditor from './AssessmentEditor';
import CodeLabEditor from './CodeLabEditor';

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

export default function EditorContainer({
    node,
    onSave,
    blueprint,
    programId,
    questionLibrary = [],
    categories = [],
    quizEditorComponent: QuizEditorComponent = AssessmentEditor,
}) {
    // Determine the type of the node/lesson to choose the correct editor
    // Normalize type string: 'Quiz' -> 'quiz', 'Assignment' -> 'assignment'
    const type = (node.type || node.node_type || '').toLowerCase();
    const lessonType = (node.properties?.lesson_type || '').toLowerCase();
    const hierarchy = Array.isArray(blueprint?.hierarchy_structure)
        ? blueprint.hierarchy_structure
        : Array.isArray(blueprint?.hierarchy)
          ? blueprint.hierarchy
          : [];
    const containerType = (hierarchy[0] || '').toLowerCase();

    // Get feature flags from blueprint (with defaults)
    const featureFlags = blueprint?.featureFlags || {
        quizzes: true,
        assignments: true,
        practicum: false,
        portfolio: false,
        gamification: false
    };

    // Container nodes are edited inline in the sidebar, not in the right editor panel.
    // Prefer blueprint taxonomy when available; fallback to common legacy labels.
    const isContainerNode = containerType
        ? type === containerType
        : ['module', 'section', 'unit', 'chapter', 'course', 'year', 'semester'].includes(type);
    if (isContainerNode) {
        return null;
    }

    // Quiz and Assignment currently use the unified AssessmentEditor.
    // Rewire point: pass `quizEditorComponent` to switch quiz-only editor behavior.
    if (type === 'quiz' || lessonType === 'quiz') {
        return (
            <QuizEditorComponent
                node={node} 
                onSave={onSave} 
                type="quiz"
                programId={programId}
                questionLibrary={questionLibrary}
                categories={categories}
            />
        );
    }

    if (type === 'assignment' || lessonType === 'assignment') {
        return (
            <AssessmentEditor 
                node={node} 
                onSave={onSave} 
                type="assignment"
                programId={programId}
                questionLibrary={questionLibrary}
                categories={categories}
            />
        );
    }

    // Code Lab
    if (type === 'code' || lessonType === 'code') {
        return <CodeLabEditor node={node} onSave={onSave} blueprint={blueprint} />;
    }

    return <ContentEditor node={node} onSave={onSave} blueprint={blueprint} />;
}
