import React from 'react';
import ContentEditor from './ContentEditor';
import QuizEditor from './QuizEditor';
import AssignmentEditor from './AssignmentEditor';

export default function EditorContainer({ node, onSave }) {
    // Determine the type of the node/lesson to choose the correct editor
    // Normalize type string: 'Quiz' -> 'quiz', 'Assignment' -> 'assignment'
    const type = (node.type || '').toLowerCase();
    const lessonType = (node.properties?.lesson_type || '').toLowerCase();

    if (type === 'quiz' || lessonType === 'quiz') {
        return <QuizEditor node={node} onSave={onSave} />;
    }

    if (type === 'assignment' || lessonType === 'assignment') {
        return <AssignmentEditor node={node} onSave={onSave} />;
    }

    // Default to Content Editor for 'Lesson' type (text, video, live_class, etc.)
    return <ContentEditor node={node} onSave={onSave} />;
}
