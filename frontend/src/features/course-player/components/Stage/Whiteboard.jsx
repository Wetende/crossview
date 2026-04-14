import { useState, useCallback, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { Box } from "@mui/material";
import LessonHeader from "./LessonHeader";
import SessionControl from "./SessionControl";
import BlockRenderer from "../Renderers/BlockRenderer";
import VideoRenderer from "../Renderers/VideoRenderer";
import TextRenderer from "../Renderers/TextRenderer";
import AssessmentRenderer from "../Renderers/AssessmentRenderer";
import DocumentLessonRenderer from "../Renderers/DocumentLessonRenderer";
import LiveClassRenderer from "../Renderers/LiveClassRenderer";
import CodeLabRenderer from "../Renderers/CodeLabRenderer";
import QuizResultsRenderer from "../Renderers/QuizResultsRenderer";

const Whiteboard = ({
    node,
    prevNode,
    nextNode,
    courseId,
    isCompleted = false,
    discussions = [],
    onVideoProgress,
}) => {
    const nodeId = node?.id;
    const [videoRequirementMet, setVideoRequirementMet] = useState(false);
    const [documentRequirementMet, setDocumentRequirementMet] = useState(false);
    const completionInFlightRef = useRef(false);

    const handleNavigate = (destination) => {
        router.visit(
            `/student/programs/${courseId}/session/${destination.id}/`,
        );
    };

    const handleComplete = () => {
        if (isCompleted || completionInFlightRef.current) return;
        completionInFlightRef.current = true;

        // POST to mark complete
        router.post(
            `/student/programs/${courseId}/session/${nodeId}/`,
            {
                mark_complete: true,
            },
            {
                preserveScroll: true,
                only: ["isCompleted", "curriculum"],
                onFinish: () => {
                    completionInFlightRef.current = false;
                },
            },
        );
    };

    const handleVideoRequirementMet = useCallback(() => {
        setVideoRequirementMet(true);
    }, []);

    const handleDocumentRequirementMet = useCallback(() => {
        setDocumentRequirementMet(true);
    }, []);

    useEffect(() => {
        setVideoRequirementMet(false);
        setDocumentRequirementMet(false);
        completionInFlightRef.current = false;
    }, [nodeId]);

    if (!node) return null;

    // Check if node has content blocks (new multi-block model) - memoized for performance
    const blocks = node?.blocks || [];
    const hasBlocks = blocks.length > 0;

    // Check if there's a video block with required progress
    const hasVideoRequirement = (() => {
        if (!node) return false;
        if (!hasBlocks) {
            const lessonType = (
                node.properties?.lesson_type ||
                node.lessonType ||
                ""
            ).toLowerCase();
            return (
                (lessonType === "video" || lessonType === "video_lesson") &&
                node.properties?.required_progress > 0
            );
        }
        return blocks.some(
            (b) =>
                b.type?.toUpperCase() === "VIDEO" &&
                b.data?.required_progress > 0,
        );
    })();

    const requiredProgress = (() => {
        if (!node) return 0;
        if (!hasBlocks) return node.properties?.required_progress || 0;
        const videoBlock = blocks.find(
            (b) =>
                b.type?.toUpperCase() === "VIDEO" &&
                b.data?.required_progress > 0,
        );
        return videoBlock?.data?.required_progress || 0;
    })();

    const documentRequirement = (() => {
        if (!node || hasBlocks) {
            return { enabled: false, pageCount: 0 };
        }

        const lessonType = (
            node.properties?.lesson_type ||
            node.lessonType ||
            ""
        ).toLowerCase();
        if (lessonType !== "document") {
            return { enabled: false, pageCount: 0 };
        }

        const document = node.properties?.document || {};
        const pageCount = Number(document.page_count || 0);
        const strictCompletion =
            typeof document.strict_completion === "boolean"
                ? document.strict_completion
                : true;

        return {
            enabled: strictCompletion && pageCount > 0,
            pageCount,
        };
    })();

    const renderBlocks = () => {
        return blocks.map((block) => (
            <BlockRenderer
                key={block.id}
                block={block}
                enrollmentId={courseId}
                nodeId={nodeId}
                onComplete={handleComplete}
                onVideoProgress={onVideoProgress}
                onVideoRequirementMet={handleVideoRequirementMet}
            />
        ));
    };

    const renderLegacyContent = () => {
        // Fallback: Normalize type from various property sources
        const type = (node.type || node.nodeType || "lesson").toLowerCase();
        const lessonType = (
            node.properties?.lesson_type ||
            node.lessonType ||
            ""
        ).toLowerCase();

        // 1. Quiz
        if (type === "quiz" || lessonType === "quiz") {
            // Show results inline if quizResults data is present
            if (node.properties?.quizResults) {
                return <QuizResultsRenderer quizResults={node.properties.quizResults} />;
            }
            return (
                <AssessmentRenderer
                    node={node}
                    enrollmentId={courseId}
                    discussions={discussions}
                    onComplete={handleComplete}
                />
            );
        }

        // 2. Assignment
        if (type === "assignment" || lessonType === "assignment") {
            return (
                <AssessmentRenderer
                    node={node}
                    enrollmentId={courseId}
                    discussions={discussions}
                    onComplete={handleComplete}
                />
            );
        }

        // 3. Video
        if (
            type === "video_lesson" ||
            lessonType === "video" ||
            lessonType === "video_lesson"
        ) {
            return (
                <VideoRenderer
                    url={node.properties?.video_url}
                    onProgress={onVideoProgress}
                    requiredProgress={node.properties?.required_progress || 0}
                    onRequirementMet={handleVideoRequirementMet}
                />
            );
        }

        // 4. Document lesson
        if (lessonType === "document") {
            return (
                <DocumentLessonRenderer
                    node={node}
                    onRequirementMet={handleDocumentRequirementMet}
                />
            );
        }

        // 5. Live class / stream lesson
        if (lessonType === "live_class") {
            return (
                <LiveClassRenderer
                    title={node.title}
                    description={node.description || ""}
                    content={node.properties?.content || ""}
                    streamUrl={node.properties?.video_url || ""}
                    startDate={node.properties?.start_date || ""}
                    startTime={node.properties?.start_time || ""}
                    endDate={node.properties?.end_date || ""}
                    endTime={node.properties?.end_time || ""}
                    timezone={node.properties?.timezone || ""}
                    duration={node.properties?.duration || ""}
                    allowJoinAnytime={!!node.properties?.allow_join_anytime}
                />
            );
        }

        // 6. Code Lab
        if (lessonType === 'code') {
            return (
                <CodeLabRenderer
                    node={node}
                    enrollmentId={courseId}
                    onComplete={handleComplete}
                />
            );
        }

        // 7. Text (Default) - render HTML content
        return (
            <TextRenderer
                title={node.title}
                content={node.properties?.content || node.contentHtml || ""}
            />
        );
    };

    // Determine if completion is allowed
    const canComplete =
        isCompleted ||
        ((!hasVideoRequirement || videoRequirementMet) &&
            (!documentRequirement.enabled || documentRequirementMet));
    const completionTooltip = (() => {
        if (isCompleted) return "";
        if (
            hasVideoRequirement &&
            !videoRequirementMet &&
            documentRequirement.enabled &&
            !documentRequirementMet
        ) {
            return `Watch at least ${requiredProgress}% of the video and read all ${documentRequirement.pageCount} pages before marking complete`;
        }
        if (hasVideoRequirement && !videoRequirementMet) {
            return `Watch at least ${requiredProgress}% of the video to mark complete`;
        }
        if (documentRequirement.enabled && !documentRequirementMet) {
            return `Read all ${documentRequirement.pageCount} pages before marking complete`;
        }
        return "";
    })();

    if (!node) return null;

    return (
        <Box
            sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
        >
            {/* Header: Lesson title */}
            <LessonHeader title={node.title} />

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
                canComplete={canComplete}
                completionTooltip={completionTooltip}
            />
        </Box>
    );
};

export default Whiteboard;
