import { Box } from "@mui/material";
import LazyReactPlayer from "@/components/LazyReactPlayer";

const VideoBlock = ({ data }) => {
    if (!data || !data.url) return null;

    return (
        <Box
            sx={{
                width: "100%",
                height: "400px",
                mb: 3,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "black",
            }}
        >
            <LazyReactPlayer
                src={data.url}
                width="100%"
                height="100%"
                controls
            />
        </Box>
    );
};

export default VideoBlock;
