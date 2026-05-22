import { describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import QuizResultsRenderer from './QuizResultsRenderer';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children }) => <div>{children}</div>,
    },
}));

describe('QuizResultsRenderer', () => {
    test('renders false correct answers instead of falling back to N/A', () => {
        const html = renderToStaticMarkup(
            <QuizResultsRenderer
                quizResults={{
                    quiz: {
                        id: 1,
                        title: 'Knowledge Check',
                        nodeTitle: 'Unit 6',
                        passThreshold: 70,
                        maxAttempts: 1,
                        showCorrectAnswer: true,
                        showAttemptHistory: false,
                    },
                    attempts: [
                        {
                            id: 11,
                            attemptNumber: 1,
                            score: 0,
                            passed: false,
                            pointsEarned: 0,
                            pointsPossible: 1,
                        },
                    ],
                    canRetry: false,
                    questionReview: [
                        {
                            questionId: 101,
                            questionText: 'It is not mandatory.',
                            studentAnswer: true,
                            correctAnswer: false,
                            isCorrect: false,
                            pointsEarned: 0,
                            pointsPossible: 1,
                        },
                    ],
                }}
            />,
        );

        expect(html).toContain('Correct answer: False');
        expect(html).not.toContain('Correct answer: N/A');
    });
});
