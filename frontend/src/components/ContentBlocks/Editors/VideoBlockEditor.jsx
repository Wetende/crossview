import { useState, useEffect } from "react";
import { Box, TextField, Typography } from "@mui/material";
import LazyReactPlayer from "@/components/LazyReactPlayer";
import { loadReactPlayer } from "@/lib/loadReactPlayer";

const VideoBlockEditor = ({ data, onChange }) => {
    const [url, setUrl] = useState(data.url || "");
    const [canPreview, setCanPreview] = useState(false);

    useEffect(() => {
        onChange({ ...data, url });
    }, [data, onChange, url]);

    useEffect(() => {
        let isMounted = true;

        if (!url) {
            setCanPreview(false);
            return undefined;
        }

        loadReactPlayer()
            .then((module) => {
                if (isMounted) {
                    setCanPreview(module.default.canPlay?.(url) ?? false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setCanPreview(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [url]);

    return (
        <Box sx={{ p: 2, border: "1px solid #eee", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
                Video Settings
            </Typography>
            <TextField
                fullWidth
                label="Video URL (YouTube, Vimeo, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
            />

            {url && canPreview && (
                <Box
                    sx={{
                        mt: 2,
                        borderRadius: 2,
                        overflow: "hidden",
                        height: 200,
                        bgcolor: "black",
                    }}
                >
                    <LazyReactPlayer
                        src={url}
                        width="100%"
                        height="100%"
                        light
                        controls
                    />
                </Box>
            )}

            {!url && (
                <Typography variant="caption" color="text.secondary">
                    Paste a URL to see a preview.
                </Typography>
            )}
        </Box>
    );
};

export default VideoBlockEditor;
