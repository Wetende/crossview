import React from 'react';
import DOMPurify from 'dompurify';
import VideoRenderer from './VideoRenderer';
import TextRenderer from './TextRenderer';
import QuizRenderer from './QuizRenderer';
import AssignmentRenderer from './AssignmentRenderer';
import { Box, Paper, Typography } from '@mui/material';
import { 
    InsertDriveFile as DocumentIcon,
    Image as ImageIcon,
    Audiotrack as AudioIcon,
    Code as EmbedIcon
} from '@mui/icons-material';

/**
 * Whitelist of allowed domains for embedded content
 */
const ALLOWED_EMBED_DOMAINS = [
    'youtube.com', 'www.youtube.com', 'youtu.be',
    'vimeo.com', 'player.vimeo.com',
    'google.com', 'docs.google.com', 'drive.google.com',
    'loom.com', 'www.loom.com',
    'canva.com', 'www.canva.com',
    'codepen.io',
    'figma.com', 'www.figma.com'
];

/**
 * Check if a URL is from an allowed embed domain
 */
const isAllowedEmbedUrl = (url) => {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        return ALLOWED_EMBED_DOMAINS.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
        );
    } catch {
        return false;
    }
};

/**
 * BlockRenderer - Renders individual content blocks based on their type.
 * Maps block_type to specialized renderer components.
 */
const BlockRenderer = ({ block, enrollmentId, nodeId, onComplete, onVideoProgress }) => {
    if (!block) return null;

    const { type, data } = block;
    const blockType = (type || '').toUpperCase();

    switch (blockType) {
        case 'VIDEO':
            return (
                <Box sx={{ mb: 3 }}>
                    <VideoRenderer 
                        url={data?.url || data?.video_url} 
                        onEnded={onComplete}
                        onProgress={onVideoProgress}
                    />
                </Box>
            );

        case 'RICHTEXT':
            return (
                <Box sx={{ mb: 3 }}>
                    <TextRenderer 
                        content={data?.html || data?.content || ''} 
                    />
                </Box>
            );

        case 'QUIZ':
            // Quiz blocks reference a quiz by ID - for inline quizzes
            // If questions are embedded directly, render them
            if (data?.questions) {
                return (
                    <Box sx={{ mb: 3 }}>
                        <QuizRenderer 
                            node={{ id: nodeId, properties: { questions: data.questions } }}
                            enrollmentId={enrollmentId}
                            onComplete={onComplete}
                        />
                    </Box>
                );
            }
            // Otherwise show a link to the quiz
            return (
                <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        Quiz ID: {data?.quiz_id} (Launch quiz to complete)
                    </Typography>
                </Paper>
            );

        case 'ASSIGNMENT':
            return (
                <Box sx={{ mb: 3 }}>
                    <AssignmentRenderer 
                        node={{ 
                            id: nodeId, 
                            title: data?.title || 'Assignment',
                            properties: data 
                        }}
                        enrollmentId={enrollmentId}
                        onSubmit={onComplete}
                    />
                </Box>
            );

        case 'DOCUMENT':
            return (
                <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DocumentIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {data?.title || 'Document'}
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
                                {data.allow_download ? 'Download' : 'View'} Document
                            </Typography>
                        )}
                    </Box>
                </Paper>
            );

        case 'IMAGE':
            return (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    {data?.url ? (
                        <Box
                            component="img"
                            src={data.url}
                            alt={data?.alt || 'Content image'}
                            sx={{ 
                                maxWidth: '100%', 
                                height: 'auto', 
                                borderRadius: 2,
                                boxShadow: 1
                            }}
                        />
                    ) : (
                        <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <ImageIcon color="action" />
                            <Typography color="text.secondary">Image not available</Typography>
                        </Paper>
                    )}
                    {data?.caption && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {data.caption}
                        </Typography>
                    )}
                </Box>
            );

        case 'AUDIO':
            return (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <AudioIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>
                            {data?.title || 'Audio'}
                        </Typography>
                    </Box>
                    {data?.url && (
                        <audio controls style={{ width: '100%' }}>
                            <source src={data.url} />
                            Your browser does not support the audio element.
                        </audio>
                    )}
                </Paper>
            );

        case 'EMBED':
            return (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <EmbedIcon color="primary" fontSize="small" />
                        <Typography variant="caption" color="text.secondary">
                            Embedded Content
                        </Typography>
                    </Box>
                    {data?.html ? (
                        <Box 
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allowfullscreen', 'frameborder', 'allow'] }) }} 
                            sx={{ '& iframe': { maxWidth: '100%' } }}
                        />
                    ) : data?.url && isAllowedEmbedUrl(data.url) ? (
                        <Box sx={{ position: 'relative', pt: '56.25%' }}>
                            <iframe
                                src={data.url}
                                title="Embedded content"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    borderRadius: 8
                                }}
                                allowFullScreen
                            />
                        </Box>
                    ) : data?.url ? (
                        <Typography color="error">
                            Embed from this domain is not allowed: {new URL(data.url).hostname}
                        </Typography>
                    ) : (
                        <Typography color="text.secondary">Embed not available</Typography>
                    )}
                </Paper>
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
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}>
                    <Typography variant="caption" color="text.secondary">
                        Unsupported block type: {blockType}
                    </Typography>
                </Paper>
            );
    }
};

export default BlockRenderer;
