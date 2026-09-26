import { Head, Link } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import DashboardLayout from "@/layouts/DashboardLayout";

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

export default function Assessments() {
    return (
        <DashboardLayout role="student">
            <Head title="Assessment Center" />

            <Stack spacing={3}>
                <motion.div {...fadeIn}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Assessment Center
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                        Assessment pages are now split into Assignments and
                        Quizzes.
                    </Typography>
                </motion.div>

                <motion.div {...fadeIn}>
                    <Alert severity="info">
                        Use the links below to view assignment submissions and
                        quiz outcomes.
                    </Alert>
                </motion.div>

                <motion.div {...fadeIn}>
                    <Card>
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Button
                                    component={Link}
                                    href="/student/assignments/"
                                    variant="contained"
                                >
                                    Go to Assignments
                                </Button>
                                <Button
                                    component={Link}
                                    href="/student/quizzes/"
                                    variant="outlined"
                                >
                                    Go to Quizzes
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            </Stack>
        </DashboardLayout>
    );
}
