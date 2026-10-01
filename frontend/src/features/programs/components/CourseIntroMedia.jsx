import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { IconPlayerPlayFilled } from "@tabler/icons-react";

import LazyReactPlayer from "@/components/LazyReactPlayer";
import { isSupportedIntroVideoUrl } from "@/utils/introVideoUrl";

export const COURSE_PLACEHOLDER_IMAGE = "/static/images/course-placeholder.svg";

// The preview's own wrapper is taken out of the tab order, so this button is
// the single keyboard stop. Its click bubbles to the preview, which loads the
// player.
function PlayButton() {
    return (
        <IconButton
            aria-label="Play intro video"
            sx={(theme) => ({
                width: 72,
                height: 72,
                color: "common.white",
                bgcolor: alpha(theme.palette.common.black, 0.6),
                "&:hover": { bgcolor: alpha(theme.palette.common.black, 0.75) },
                "&.Mui-focusVisible": {
                    outline: "3px solid",
                    outlineColor: "primary.light",
                    outlineOffset: 2,
                },
            })}
        >
            <IconPlayerPlayFilled size={32} aria-hidden />
        </IconButton>
    );
}

// Hero media for the public course page: the intro video when one is set,
// otherwise the course thumbnail. The video always starts as a light preview,
// so no third-party player loads until the visitor presses play.
export default function CourseIntroMedia({ introVideoUrl, thumbnail, title }) {
    const [playing, setPlaying] = useState(false);

    if (isSupportedIntroVideoUrl(introVideoUrl)) {
        return (
            <Box
                data-testid="course-intro-video"
                sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16 / 9",
                    mb: 3,
                    overflow: "hidden",
                    borderRadius: 2,
                    bgcolor: "common.black",
                }}
            >
                <LazyReactPlayer
                    src={introVideoUrl.trim()}
                    light={thumbnail || COURSE_PLACEHOLDER_IMAGE}
                    playIcon={<PlayButton />}
                    previewTabIndex={-1}
                    playing={playing}
                    onClickPreview={() => setPlaying(true)}
                    controls
                    width="100%"
                    height="100%"
                />
            </Box>
        );
    }

    if (!thumbnail) return null;

    return (
        <Box
            component="img"
            src={thumbnail}
            alt={title}
            sx={{
                width: "100%",
                height: 350,
                objectFit: "cover",
                borderRadius: 2,
                mb: 3,
            }}
        />
    );
}
