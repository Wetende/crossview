import DOMPurify from "dompurify";
import VideoRenderer from "./VideoRenderer";
import TextRenderer from "./TextRenderer";
import AssessmentRenderer from "./AssessmentRenderer";
import CodeLabRenderer from "./CodeLabRenderer";
import PDFRenderer from "./PDFRenderer";
import AudioRenderer from "./AudioRenderer";
import { useRef } from "react";
import {
    createActivitySessionId,
    recordActivityProgress,
} from "../../api/activityProgressApi";
import { Box, Paper, Typography } from "@mui/material";
import {
    InsertDriveFile as DocumentIcon,
    Image as ImageIcon,
    Code as EmbedIcon,
} from "@mui/icons-material";

/**
 * Whitelist of allowed domains for embedded content
 */
const ALLOWED_EMBED_DOMAINS = [
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "vimeo.com",
    "player.vimeo.com",
    "google.com",
    "docs.google.com",
    "drive.google.com",
    "loom.com",
    "www.loom.com",
    "canva.com",
    "www.canva.com",
    "codepen.io",
    "figma.com",
    "www.figma.com",
];

/**
 * Check if a URL is from an allowed embed domain
 */
const isAllowedEmbedUrl = (url) => {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        return ALLOWED_EMBED_DOMAINS.some(
            (domain) =>
                urlObj.hostname === domain ||
                urlObj.hostname.endsWith("." + domain),
        );
    } catch {
        return false;
    }
};

/**
 * BlockRenderer - Renders individual content blocks based on their type.
 * Maps block_type to specialized renderer components.
 */
const BlockRenderer = ({
    block,
    enrollmentId,
    nodeId,
    onComplete,
    onVideoProgress,
    onVideoRequirementMet,
    activityProgress,
}) => {
    const documentSessionRef = useRef(createActivitySessionId());
    const documentSequenceRef = useRef(0);
    if (!block) return null;

    const { type, data } = block;
    const blockType = (type || "").toUpperCase();

    switch (blockType) {
        case "VIDEO":
            return (
                <Box sx={{ mb: 3 }}>
                    <VideoRenderer
                        url={data?.url || data?.video_url}
                        onEnded={onComplete}
                        onProgress={onVideoProgress}
                        requiredProgress={data?.required_progress || 0}
                        onRequirementMet={onVideoRequirementMet}
                        enrollmentId={enrollmentId}
                        nodeId={nodeId}
                        activityProgress={activityProgress}
                    />
                </Box>
            );

        case "RICHTEXT":
            return (
                <Box sx={{ mb: 3 }}>
                    <TextRenderer content={data?.html || data?.content || ""} />
                </Box>
            );

        case "QUIZ":
            // Prefer dedicated quiz flow when a quiz reference exists.
            if (data?.quiz_id) {
                return (
                    <Box sx={{ mb: 3 }}>
                        <AssessmentRenderer
                            node={{
                                id: nodeId,
                                title: data?.quiz_title || "Quiz",
                                node_type: "quiz",
                                properties: {
                                    quiz_id: data.quiz_id,
                                    questions: data.questions,
                                },
                            }}
                            enrollmentId={enrollmentId}
                            onComplete={onComplete}
                        />
                    </Box>
                );
            }

            // Legacy inline fallback for embedded questions.
            if (data?.questions) {
                return (
                    <Box sx={{ mb: 3 }}>
                        <AssessmentRenderer
                            node={{
                                id: nodeId,
                                title: data?.quiz_title || "Quiz",
                                node_type: "quiz",
                                properties: { questions: data.questions },
                            }}
                            enrollmentId={enrollmentId}
                            onComplete={onComplete}
                        />
                    </Box>
                );
            }

            // Missing quiz configuration.
            return (
                <Paper sx={{ p: 3, mb: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        Quiz block is not configured.
                    </Typography>
                </Paper>
            );

        case "ASSIGNMENT":
            return (
                <Box sx={{ mb: 3 }}>
                    <AssessmentRenderer
                        node={{
                            id: nodeId,
                            title: data?.title || "Assignment",
                            node_type: "assignment",
                            properties: data,
                        }}
                        enrollmentId={enrollmentId}
                        onComplete={onComplete}
                    />
                </Box>
            );

        case "PDF":
            return (
                <Box sx={{ mb: 3 }}>
                    <PDFRenderer
                        url={data?.url || data?.file_path}
                        allowDownload={data?.allow_download !== false}
                        allowPrint={data?.allow_print !== false}
                        requiredPages={data?.required_pages || 0}
                        initialPagesViewed={activityProgress?.pagesViewed || []}
                        onProgress={(_count, _total, pageNumber) => {
                            if (!pageNumber) return;
                            recordActivityProgress(enrollmentId, nodeId, {
                                eventType: "page_view",
                                sessionId: documentSessionRef.current,
                                sequence: ++documentSequenceRef.current,
                                pageNumber,
                            })
                                .then((result) => {
                                    if (result.isCompleted) onComplete?.();
                                })
                                .catch(() => {});
                        }}
                    />
                </Box>
            );

        case "DOCUMENT":
            return (
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <DocumentIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {data?.title || "Document"}
                        </Typography>
                        {data?.file_path && (
                            <Typography
                                component="a"
                                href={data.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="body2"
                                color="primary"
                            >
                                {data.allow_download ? "Download" : "View"}{" "}
                                Document
                            </Typography>
                        )}
                    </Box>
                </Paper>
            );

        case "IMAGE":
            return (
                <Box sx={{ mb: 3, textAlign: "center" }}>
                    {data?.url ? (
                        <Box
                            component="img"
                            loading="lazy"
                            src={data.url}
                            alt={data?.alt || "Content image"}
                            sx={{
                                maxWidth: "100%",
                                height: "auto",
                                borderRadius: 2,
                                boxShadow: 1,
                            }}
                        />
                    ) : (
                        <Paper
                            sx={{
                                p: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                            }}
                        >
                            <ImageIcon color="action" />
                            <Typography color="text.secondary">
                                Image not available
                            </Typography>
                        </Paper>
                    )}
                    {data?.caption && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: "block" }}
                        >
                            {data.caption}
                        </Typography>
                    )}
                </Box>
            );

        case "AUDIO":
            return (
                <Box sx={{ mb: 3 }}>
                    <AudioRenderer
                        url={data?.url || data?.audio_url}
                        enrollmentId={enrollmentId}
                        nodeId={nodeId}
                        activityProgress={activityProgress}
                        onRequirementMet={onVideoRequirementMet}
                    />
                </Box>
            );

        case "EMBED":
            return (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 2,
                        }}
                    >
                        <EmbedIcon color="primary" fontSize="small" />
                        <Typography variant="caption" color="text.secondary">
                            Embedded Content
                        </Typography>
                    </Box>
                    {data?.html ? (
                        <Box
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(data.html, {
                                    ADD_TAGS: ["iframe"],
                                    ADD_ATTR: [
                                        "allowfullscreen",
                                        "frameborder",
                                        "allow",
                                    ],
                                }),
                            }}
                            sx={{ "& iframe": { maxWidth: "100%" } }}
                        />
                    ) : data?.url && isAllowedEmbedUrl(data.url) ? (
                        <Box sx={{ position: "relative", pt: "56.25%" }}>
                            <iframe
                                src={data.url}
                                title="Embedded content"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    border: "none",
                                    borderRadius: 8,
                                }}
                                allowFullScreen
                            />
                        </Box>
                    ) : data?.url ? (
                        <Typography color="error">
                            Embed from this domain is not allowed
                        </Typography>
                    ) : (
                        <Typography color="text.secondary">
                            Embed not available
                        </Typography>
                    )}
                </Paper>
            );

        case "CODE":
            return (
                <Box sx={{ mb: 3 }}>
                    <CodeLabRenderer
                        node={{ id: nodeId, properties: data }}
                        enrollmentId={enrollmentId}
                        onComplete={onComplete}
                    />
                </Box>
            );

        default:
            // Unknown block type - render as text if there's content
            if (data?.content || data?.html) {
                return (
                    <Box sx={{ mb: 3 }}>
                        <TextRenderer content={data.html || data.content} />
                    </Box>
                );
            }
            return (
                <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.100" }}>
                    <Typography variant="caption" color="text.secondary">
                        Unsupported block type: {blockType}
                    </Typography>
                </Paper>
            );
    }
};

export default BlockRenderer;
