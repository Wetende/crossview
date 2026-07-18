import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import StarsIcon from "@mui/icons-material/Stars";

const normalizeGamification = ({ gamification, enrollments }) => {
    if (gamification) {
        return gamification;
    }
    const eligible = (enrollments || [])
        .map((enrollment) => enrollment.gamification)
        .filter((item) => item?.enabled);
    if (!eligible.length) {
        return null;
    }
    const badges = new Map();
    eligible.flatMap((item) => item.badges || []).forEach((badge) => {
        badges.set(badge.code, badge);
    });
    return {
        enabled: true,
        xp: eligible.reduce((total, item) => total + (item.xp || 0), 0),
        streak: {
            currentDays: Math.max(
                0,
                ...eligible.map((item) => item.streak?.currentDays || 0),
            ),
            longestDays: Math.max(
                0,
                ...eligible.map((item) => item.streak?.longestDays || 0),
            ),
        },
        badges: [...badges.values()],
    };
};

export default function LearningMomentum({ gamification = null, enrollments = null }) {
    const data = normalizeGamification({ gamification, enrollments });
    if (!data?.enabled) {
        return null;
    }

    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={2}>
                <Typography variant="h6">Learning momentum</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <StarsIcon color="warning" />
                        <Box>
                            <Typography fontWeight="bold">{data.xp || 0} XP</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Experience earned
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <LocalFireDepartmentIcon color="error" />
                        <Box>
                            <Typography fontWeight="bold">
                                {data.streak?.currentDays || 0} day streak
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Longest: {data.streak?.longestDays || 0} days
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
                {(data.badges || []).length > 0 && (
                    <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                        {(data.badges || []).map((badge) => (
                            <Chip
                                key={badge.code}
                                icon={<EmojiEventsIcon />}
                                label={badge.name}
                                title={badge.description || badge.name}
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                )}
            </Stack>
        </Paper>
    );
}
