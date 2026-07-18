import { Button, Paper, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export default function ClassroomCompanionCard({ classroom }) {
    if (!classroom?.connected) {
        return null;
    }
    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
                <Typography variant="h6">Google Classroom companion</Typography>
                <Typography variant="body2" color="text.secondary">
                    Course enrollment and Classroom membership are separate. Continue using
                    this course player for lessons, submissions, quizzes and progress.
                </Typography>
                <Typography variant="body2">
                    Membership: {classroom.membershipStatus?.replaceAll("_", " ")}
                </Typography>
                {classroom.classCode && (
                    <Typography>Class code: <strong>{classroom.classCode}</strong></Typography>
                )}
                {classroom.alternateLink && (
                    <Button
                        component="a"
                        href={classroom.alternateLink}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        endIcon={<OpenInNewIcon />}
                    >
                        Open Classroom
                    </Button>
                )}
            </Stack>
        </Paper>
    );
}
