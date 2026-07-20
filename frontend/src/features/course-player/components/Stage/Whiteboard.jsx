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
import { ACTIVITY_TYPES } from "@/lib/activityTypes";
import { resolvePlayerComposition } from "../../playerComposition";

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

    const { activityType, legacyPrimaryBlock, supplements } =
        resolvePlayerComposition(node);
    const blocks = node?.supplements || node?.blocks || [];

    // Check if there's a video block with required progress
    const hasVideoRequirement = (() => {
        if (!node) return false;
        if (activityType === ACTIVITY_TYPES.VIDEO && !legacyPrimaryBlock) {
            return (
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
        if (activityType === ACTIVITY_TYPES.VIDEO && !legacyPrimaryBlock) {
            return node.properties?.required_progress || 0;
        }
        const videoBlock = blocks.find(
            (b) =>
                b.type?.toUpperCase() === "VIDEO" &&
                b.data?.required_progress > 0,
        );
        return videoBlock?.data?.required_progress || 0;
    })();

    const documentRequirement = (() => {
        if (!node) {
            return { enabled: false, pageCount: 0 };
        }
        if (activityType !== ACTIVITY_TYPES.DOCUMENT || legacyPrimaryBlock) {
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

    const renderBlocks = (contentBlocks) => {
        return contentBlocks.map((block) => (
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

    const renderPrimaryContent = () => {
        if (legacyPrimaryBlock) {
            return renderBlocks([legacyPrimaryBlock]);
        }

        // 1. Quiz
        if (activityType === ACTIVITY_TYPES.QUIZ) {
            // Show results inline if quizResults data is present
            if (node.properties?.quizResults) {
                return (
                    <QuizResultsRenderer
                        quizResults={node.properties.quizResults}
                        nextNode={nextNode}
                    />
                );
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
        if (activityType === ACTIVITY_TYPES.ASSIGNMENT) {
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
        if (activityType === ACTIVITY_TYPES.VIDEO) {
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
        if (activityType === ACTIVITY_TYPES.DOCUMENT) {
            return (
                <DocumentLessonRenderer
                    node={node}
                    onRequirementMet={handleDocumentRequirementMet}
                />
            );
        }

        // 5. Live class / stream lesson
        if (
            activityType === ACTIVITY_TYPES.LIVE_MEETING ||
            activityType === ACTIVITY_TYPES.LIVE_STREAM
        ) {
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
        if (activityType === ACTIVITY_TYPES.CODE) {
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
                {renderPrimaryContent()}
                {supplements.length > 0 && (
                    <Box sx={{ mt: 3 }}>{renderBlocks(supplements)}</Box>
                )}
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
