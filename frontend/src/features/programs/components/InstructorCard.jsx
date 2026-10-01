import { useId } from "react";
import { Avatar, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { IconBrandLinkedin } from "@tabler/icons-react";

function getInitials(name) {
    const words = String(name || "").trim().split(/\s+/).filter(Boolean);
    return words
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
}

function isSafeExternalUrl(url) {
    return /^https?:\/\//i.test(String(url || ""));
}

export default function InstructorCard({ instructor }) {
    const headingId = useId();

    if (!instructor?.name) return null;

    const { name, jobTitle, bio, linkedinUrl } = instructor;

    return (
        <Box component="section" aria-labelledby={headingId} sx={{ mt: 4 }}>
            <Typography id={headingId} variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Instructor
            </Typography>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Avatar
                            aria-hidden
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                fontWeight: 700,
                            }}
                        >
                            {getInitials(name) || "I"}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                component="p"
                                variant="h6"
                                sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
                            >
                                {name}
                            </Typography>
                            {jobTitle ? (
                                <Typography variant="body2" color="textSecondary">
                                    {jobTitle}
                                </Typography>
                            ) : null}
                        </Box>
                    </Stack>
                    {bio ? (
                        <Typography
                            variant="body2"
                            sx={{ mt: 2, whiteSpace: "pre-line", overflowWrap: "anywhere" }}
                        >
                            {bio}
                        </Typography>
                    ) : null}
                    {isSafeExternalUrl(linkedinUrl) ? (
                        <Button
                            component="a"
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outlined"
                            size="small"
                            startIcon={<IconBrandLinkedin size={18} aria-hidden />}
                            aria-label={`${name} on LinkedIn (opens in a new tab)`}
                            sx={{ mt: 2 }}
                        >
                            LinkedIn
                        </Button>
                    ) : null}
                </CardContent>
            </Card>
        </Box>
    );
}
