import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import QuizAnswerReview from './QuizAnswerReview';

describe('QuizAnswerReview', () => {
    test('preserves false correct answers from per-question results', () => {
        const html = renderToStaticMarkup(
            <QuizAnswerReview
                defaultExpanded
                attempt={{
                    id: 22,
                    answers: { 101: true },
                    questionResults: [
                        {
                            questionId: 101,
                            isCorrect: false,
                            correctAnswer: false,
                            pointsEarned: 0,
                        },
                    ],
                }}
                questions={[
                    {
                        id: 101,
                        text: 'It is not mandatory.',
                        type: 'true_false',
                        points: 1,
                        correctAnswer: true,
                    },
                ]}
            />,
        );

        expect(html).toContain('Correct Answer:');
        expect(html).toContain('False');
        expect(html).not.toContain('No answer provided');
    });
});
