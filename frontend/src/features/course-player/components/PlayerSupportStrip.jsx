import { Chip, Paper, Stack } from "@mui/material";
import {
    EmojiEvents as BadgeIcon,
    LocalFireDepartment as StreakIcon,
    Stars as XpIcon,
} from "@mui/icons-material";

export default function PlayerSupportStrip({ gamification }) {
    const showMomentum = gamification?.enabled;
    if (!showMomentum) return null;

    return (
        <Paper variant="outlined" sx={{ p: 1, mb: 2, borderRadius: 2 }}>
            <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
                {showMomentum && (
                    <>
                        <Chip
                            size="small"
                            icon={<XpIcon />}
                            label={`${gamification.xp || 0} XP`}
                        />
                        <Chip
                            size="small"
                            icon={<StreakIcon />}
                            label={`${gamification.streak?.currentDays || 0} day streak`}
                        />
                        {(gamification.badges || []).length > 0 && (
                            <Chip
                                size="small"
                                icon={<BadgeIcon />}
                                label={`${gamification.badges.length} badges`}
                            />
                        )}
                    </>
                )}
            </Stack>
        </Paper>
    );
}
