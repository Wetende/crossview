import { Button, Chip, Paper, Stack } from "@mui/material";
import {
    EmojiEvents as BadgeIcon,
    LocalFireDepartment as StreakIcon,
    OpenInNew as OpenIcon,
    School as ClassroomIcon,
    Stars as XpIcon,
} from "@mui/icons-material";

export default function PlayerSupportStrip({ gamification, classroom }) {
    const showMomentum = gamification?.enabled;
    const showClassroom = classroom?.connected;
    if (!showMomentum && !showClassroom) return null;

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
                {showClassroom && (
                    <Chip
                        size="small"
                        icon={<ClassroomIcon />}
                        label={`Classroom: ${(classroom.membershipStatus || "not joined").replaceAll("_", " ")}`}
                    />
                )}
                {showClassroom && classroom.classCode && (
                    <Chip
                        size="small"
                        label={`Class code: ${classroom.classCode}`}
                    />
                )}
                {showClassroom && classroom.alternateLink && (
                    <Button
                        size="small"
                        component="a"
                        href={classroom.alternateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenIcon />}
                        sx={{ ml: { sm: "auto" } }}
                    >
                        Google Classroom
                    </Button>
                )}
            </Stack>
        </Paper>
    );
}
