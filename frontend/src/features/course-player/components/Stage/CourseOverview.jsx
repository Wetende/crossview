import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Stack,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
} from "@mui/material";
import {
    Description as DocIcon,
    CheckCircle as CheckIcon,
    Download as DownloadIcon,
    Notifications as NoticeIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import DOMPurify from "dompurify";
import DeliveryOverviewCard from "./DeliveryOverviewCard";

export default function CourseOverview({ program, enrollment, resumeUrl }) {
    const hasStarted = (enrollment?.progressPercent || 0) > 0;
    const hasNotices = program?.notices?.length > 0;
    const hasWhatYouLearn =
        program?.whatYouLearnHtml || program?.whatYouLearnItems?.length > 0;
    const hasResources = program?.resources?.length > 0;
    const getNoticeTitle = (notice, index) => {
        if (typeof notice === "string") return null;
        return notice?.title || `Notice ${index + 1}`;
    };
    const getNoticeContent = (notice) => {
        if (typeof notice === "string") return notice;
        return notice?.content || notice?.text || notice?.message || "";
    };

    return (
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
            {/* Overview header */}
            <Box
                sx={{
                    mb: { xs: 2.5, md: 3 },
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "flex-start" },
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ mb: program?.description ? 1 : 0 }}
                    >
                        {program?.name || "Course"}
                    </Typography>
                    {program?.description && (
                        <Box
                            sx={{
                                maxWidth: 620,
                                color: "text.secondary",
                                "& p": { mb: 0.75 },
                                "& p:last-of-type": { mb: 0 },
                            }}
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(program.description),
                            }}
                        />
                    )}
                </Box>
            </Box>

            <DeliveryOverviewCard
                program={program}
                resumeUrl={resumeUrl}
                hasStarted={hasStarted}
                progressPercent={enrollment?.progressPercent || 0}
            />

            {(enrollment?.upcomingDeadlines || []).length > 0 && (
                <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 1 }}>
                    <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 1 }}
                        >
                            <ScheduleIcon color="warning" fontSize="small" />
                            <Typography variant="h6" fontWeight={700}>
                                Upcoming deadlines
                            </Typography>
                        </Stack>
                        <List dense disablePadding>
                            {enrollment.upcomingDeadlines
                                .slice(0, 3)
                                .map((deadline) => (
                                    <ListItem
                                        key={`${deadline.type}-${deadline.id}`}
                                        disableGutters
                                    >
                                        <ListItemText
                                            primary={deadline.title}
                                            secondary={new Date(
                                                deadline.dueAt,
                                            ).toLocaleString()}
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* Notices */}
            {hasNotices && (
                <Box sx={{ mb: 3 }}>
                    {program.notices.map((notice, idx) => (
                        <Alert
                            key={idx}
                            severity={
                                notice.type === "warning" ? "warning" : "info"
                            }
                            icon={<NoticeIcon />}
                            sx={{ mb: 1, borderRadius: 2 }}
                        >
                            {getNoticeTitle(notice, idx) && (
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={700}
                                    sx={{ mb: 0.5 }}
                                >
                                    {getNoticeTitle(notice, idx)}
                                </Typography>
                            )}
                            <Box
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                        getNoticeContent(notice),
                                    ),
                                }}
                            />
                        </Alert>
                    ))}
                </Box>
            )}

            {/* What You'll Learn */}
            {hasWhatYouLearn && (
                <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 1 }}>
                    <CardContent
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            "&:last-child": { pb: { xs: 2, md: 2.5 } },
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 2 }}
                        >
                            <CheckIcon color="success" fontSize="small" />
                            <Typography variant="h6" fontWeight={700}>
                                What You&rsquo;ll Learn
                            </Typography>
                        </Stack>
                        {program.whatYouLearnHtml ? (
                            <Box
                                sx={{
                                    "& ul, & ol": { pl: 3, mb: 1 },
                                    "& li": {
                                        mb: 0.5,
                                        color: "text.secondary",
                                    },
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                        program.whatYouLearnHtml,
                                    ),
                                }}
                            />
                        ) : (
                            <List dense disablePadding>
                                {program.whatYouLearnItems.map((item, idx) => (
                                    <ListItem
                                        key={idx}
                                        disableGutters
                                        sx={{ py: 0.25 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            <CheckIcon
                                                color="success"
                                                fontSize="small"
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Course Resources */}
            {hasResources && (
                <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 1 }}>
                    <CardContent
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            "&:last-child": { pb: { xs: 2, md: 2.5 } },
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 2 }}
                        >
                            <DownloadIcon color="info" fontSize="small" />
                            <Typography variant="h6" fontWeight={700}>
                                Course Resources
                            </Typography>
                        </Stack>
                        <List dense disablePadding>
                            {program.resources.map((res) => (
                                <ListItem
                                    key={res.id}
                                    disableGutters
                                    sx={{ py: 0.5 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                        <DocIcon
                                            fontSize="small"
                                            color="action"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            res.title || `Resource ${res.id}`
                                        }
                                        primaryTypographyProps={{
                                            variant: "body2",
                                        }}
                                    />
                                    <Button
                                        component="a"
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            minWidth: "auto",
                                            textTransform: "none",
                                        }}
                                    >
                                        Download
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
