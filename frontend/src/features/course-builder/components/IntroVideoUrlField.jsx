import { Box, InputLabel, TextField } from "@mui/material";

import { getIntroVideoUrlError } from "@/utils/introVideoUrl";

const INPUT_ID = "course-intro-video-url";

export default function IntroVideoUrlField({ value, onChange }) {
    const error = getIntroVideoUrlError(value);

    return (
        <Box>
            <InputLabel
                shrink
                htmlFor={INPUT_ID}
                sx={{ mb: 1, fontWeight: 500, color: "text.primary", display: "block" }}
            >
                Intro video URL
            </InputLabel>
            <TextField
                id={INPUT_ID}
                type="url"
                fullWidth
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="https://"
                error={Boolean(error)}
                helperText={
                    error ||
                    "A YouTube or Vimeo video link, or a direct HTTPS .mp4 or .webm file. Plays in place of the course image on the public page."
                }
                slotProps={{ htmlInput: { inputMode: "url", spellCheck: false } }}
            />
        </Box>
    );
}
