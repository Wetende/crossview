import { Head, Link } from "@inertiajs/react";
import { Button, Container, Stack } from "@mui/material";
import { IconArrowLeft } from "@tabler/icons-react";

import QuizResultsRenderer from "@/features/course-player/components/Renderers/QuizResultsRenderer";

export default function Results({
    attempts,
    attemptsRemaining,
    canRetry,
    correctAnswersReleased,
    coursePlayer,
    officialAttempt,
    questionReview = [],
    quiz,
    retryLockReason,
    reviewedAttempt,
}) {
    const backUrl = coursePlayer?.sessionUrl || "/dashboard/";
    const backLabel = coursePlayer?.sessionUrl
        ? "Back to lesson"
        : "Back to dashboard";

    return (
        <>
            <Head title={`Results: ${quiz.title}`} />
            <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                <Stack direction="row" spacing={1.5} sx={{ mb: 1 }}>
                    <Button
                        component={Link}
                        href={backUrl}
                        startIcon={<IconArrowLeft size={18} />}
                        variant="text"
                    >
                        {backLabel}
                    </Button>
                </Stack>
                <QuizResultsRenderer
                    quizResults={{
                        attempts,
                        attemptsRemaining,
                        canRetry,
                        correctAnswersReleased,
                        officialAttempt,
                        questionReview,
                        quiz,
                        retryLockReason,
                        reviewedAttempt,
                    }}
                    nextNode={coursePlayer?.nextNode || null}
                />
            </Container>
        </>
    );
}
