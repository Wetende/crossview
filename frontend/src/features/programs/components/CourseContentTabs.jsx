import { useState } from "react";
import DOMPurify from "dompurify";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Rating,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import {
    IconBroadcast,
    IconChevronDown,
    IconClipboardCheck,
    IconCode,
    IconFileText,
    IconFolder,
    IconLock,
    IconPlayerPlay,
} from "@tabler/icons-react";

import {
    curriculumAccordionSx,
    curriculumSummarySx,
    greyAccordionSx,
    greyDetailsSx,
    greySummarySx,
    learningOutcomesSx,
    lessonListSx,
    lessonRowSx,
    richTextSx,
    tabPanelSx,
    tabsBarSx,
    tabsSx,
} from "./coursePresentationStyles";

const TAB_LABELS = [
    "Description",
    "Curriculum",
    "Resources",
    "FAQ",
    "Notice",
    "Reviews",
];

function TabPanel({ children, value, index }) {
    const tabId = `course-tab-${index}`;
    const panelId = `course-tabpanel-${index}`;

    return (
        <Box
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={value !== index}
            sx={tabPanelSx}
        >
            {value === index && children}
        </Box>
    );
}

function EmptyState({ children }) {
    return (
        <Typography color="text.secondary" sx={{ py: 1 }}>
            {children}
        </Typography>
    );
}

function SanitizedHtml({ html, sx }) {
    return (
        <Box
            sx={sx}
            dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(html || ""),
            }}
        />
    );
}

function getLessonVisual(lesson) {
    const lessonType = `${lesson?.type || ""} ${lesson?.lessonType || ""}`.toLowerCase();

    if (lessonType.includes("quiz") || lessonType.includes("assessment") || lessonType.includes("assignment")) {
        return { Icon: IconClipboardCheck, color: "warning.main" };
    }
    if (lessonType.includes("video")) {
        return { Icon: IconPlayerPlay, color: "primary.main" };
    }
    if (lessonType.includes("live") || lessonType.includes("stream")) {
        return { Icon: IconBroadcast, color: "secondary.main" };
    }
    if (lessonType.includes("code")) {
        return { Icon: IconCode, color: "success.main" };
    }
    return { Icon: IconFileText, color: "success.main" };
}

function CurriculumContent({ curriculum }) {
    const [expandedSection, setExpandedSection] = useState(
        curriculum[0]?.id ?? false,
    );

    if (curriculum.length === 0) {
        return <EmptyState>Curriculum details coming soon.</EmptyState>;
    }

    return (
        <Stack spacing={2.5}>
            {curriculum.map((section) => {
                const sectionKey = section.id ?? section.title;
                const isExpanded = expandedSection === sectionKey;
                const lessons = section.children || [];

                return (
                    <Accordion
                        key={sectionKey}
                        expanded={isExpanded}
                        onChange={(_, expanded) =>
                            setExpandedSection(expanded ? sectionKey : false)
                        }
                        disableGutters
                        sx={curriculumAccordionSx}
                    >
                        <AccordionSummary
                            expandIcon={<IconChevronDown size={18} />}
                            sx={curriculumSummarySx}
                        >
                            <Typography component="span" variant="h6" fontWeight={600}>
                                {section.title}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <Box sx={lessonListSx}>
                                {lessons.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ px: 2.25, py: 2 }}>
                                        No lessons in this section yet.
                                    </Typography>
                                ) : (
                                    <List disablePadding>
                                        {lessons.map((lesson) => {
                                            const { Icon, color } = getLessonVisual(lesson);
                                            return (
                                                <ListItem
                                                    key={lesson.id ?? lesson.title}
                                                    data-testid={`curriculum-lesson-${lesson.id ?? lesson.title}`}
                                                    sx={lessonRowSx}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 34 }}>
                                                        <Box component={Icon} aria-hidden sx={{ color, fontSize: 20 }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={lesson.title}
                                                        primaryTypographyProps={{
                                                            variant: "body2",
                                                            fontWeight: 600,
                                                            sx: { whiteSpace: "normal", overflowWrap: "anywhere" },
                                                        }}
                                                    />
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                        sx={{ ml: 1, flexShrink: 0 }}
                                                    >
                                                        {lesson.duration ? (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {lesson.duration} min
                                                            </Typography>
                                                        ) : null}
                                                        {lesson.isPreview ? (
                                                            <Chip label="Preview" size="small" color="primary" variant="outlined" />
                                                        ) : (
                                                            <IconLock aria-label="Locked content" size={18} color="currentColor" />
                                                        )}
                                                    </Stack>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                )}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Stack>
    );
}

function GreyAccordionList({ items, expandedItem, onExpandedItemChange, getTitle, getContent }) {
    return (
        <Stack spacing={1.5}>
            {items.map((item, index) => {
                const itemKey = item?.id ?? index;
                return (
                    <Accordion
                        key={itemKey}
                        expanded={expandedItem === itemKey}
                        onChange={(_, expanded) =>
                            onExpandedItemChange(expanded ? itemKey : false)
                        }
                        disableGutters
                        sx={greyAccordionSx}
                    >
                        <AccordionSummary
                            expandIcon={<IconChevronDown size={18} />}
                            sx={greySummarySx}
                        >
                            <Typography component="span" variant="subtitle1" fontWeight={700}>
                                {getTitle(item, index)}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={greyDetailsSx}>
                            <SanitizedHtml html={getContent(item)} />
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Stack>
    );
}

export default function CourseContentTabs({
    program,
    curriculum = [],
    value: controlledValue,
    onChange,
}) {
    const [internalValue, setInternalValue] = useState(0);
    const [expandedFaq, setExpandedFaq] = useState(false);
    const [expandedNotice, setExpandedNotice] = useState(false);
    const value = controlledValue ?? internalValue;

    const handleTabChange = (event, nextValue) => {
        if (controlledValue === undefined) {
            setInternalValue(nextValue);
        }
        onChange?.(event, nextValue);
    };

    return (
        <Box data-testid="course-content-tabs" sx={{ minWidth: 0, maxWidth: "100%" }}>
            <Box sx={tabsBarSx}>
                <Tabs
                    aria-label="Course information"
                    value={value}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={tabsSx}
                >
                    {TAB_LABELS.map((label, index) => (
                        <Tab
                            key={label}
                            id={`course-tab-${index}`}
                            aria-controls={`course-tabpanel-${index}`}
                            label={label}
                        />
                    ))}
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <SanitizedHtml html={program.description} sx={richTextSx} />
                {program.what_you_learn_html ? (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                            What you&apos;ll learn
                        </Typography>
                        <SanitizedHtml html={program.what_you_learn_html} sx={learningOutcomesSx} />
                    </Box>
                ) : null}
            </TabPanel>

            <TabPanel value={value} index={1}>
                <CurriculumContent curriculum={curriculum} />
            </TabPanel>

            <TabPanel value={value} index={2}>
                {!program.resources || program.resources.length === 0 ? (
                    <EmptyState>No downloadable resources available.</EmptyState>
                ) : (
                    <List>
                        {program.resources.map((resource) => (
                            <ListItem key={resource.id} divider>
                                <ListItemIcon>
                                    <IconFolder size={24} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ textDecoration: "none", color: "inherit", fontWeight: 500 }}
                                        >
                                            {resource.title}
                                        </a>
                                    }
                                    secondary={resource.type}
                                />
                                <Button
                                    component="a"
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="outlined"
                                    size="small"
                                >
                                    Download
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                )}
            </TabPanel>

            <TabPanel value={value} index={3}>
                {!program.faq || program.faq.length === 0 ? (
                    <EmptyState>No FAQs available for this course.</EmptyState>
                ) : (
                    <GreyAccordionList
                        items={program.faq}
                        expandedItem={expandedFaq}
                        onExpandedItemChange={setExpandedFaq}
                        getTitle={(item) => item.question}
                        getContent={(item) => item.answer}
                    />
                )}
            </TabPanel>

            <TabPanel value={value} index={4}>
                {!program.notices || program.notices.length === 0 ? (
                    <EmptyState>No notices for this course.</EmptyState>
                ) : (
                    <GreyAccordionList
                        items={program.notices}
                        expandedItem={expandedNotice}
                        onExpandedItemChange={setExpandedNotice}
                        getTitle={(notice, index) =>
                            typeof notice === "string" ? `Notice ${index + 1}` : notice.title
                        }
                        getContent={(notice) =>
                            typeof notice === "string" ? notice : notice.content
                        }
                    />
                )}
            </TabPanel>

            <TabPanel value={value} index={5}>
                {!program.reviews || program.reviews.length === 0 ? (
                    <EmptyState>No reviews yet.</EmptyState>
                ) : (
                    <Stack spacing={2}>
                        {program.reviews.map((review) => (
                            <Card key={review.id} variant="outlined">
                                <CardContent>
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Rating value={review.rating || 0} precision={1} size="small" readOnly />
                                            <Typography variant="body2" fontWeight={600}>
                                                {review.user?.name || "Anonymous"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {review.updatedAt
                                                    ? new Date(review.updatedAt).toLocaleDateString()
                                                    : ""}
                                            </Typography>
                                        </Stack>
                                        <SanitizedHtml html={review.reviewText} />
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </TabPanel>
        </Box>
    );
}
