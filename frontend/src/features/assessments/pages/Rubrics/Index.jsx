import React from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    Chip,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DashboardLayout from "@/layouts/DashboardLayout";

const RubricsIndex = ({ rubrics, can_create }) => {
    return (
        <DashboardLayout>
            <Head title="Rubrics" />

            <Box
                sx={{
                    mb: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="h4" component="h1">
                    Rubrics
                </Typography>

                {can_create && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/assessments/rubrics/create/"
                    >
                        Create Rubric
                    </Button>
                )}
            </Box>

            {rubrics.length === 0 ? (
                <Box
                    sx={{
                        textAlign: "center",
                        py: 8,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        No rubrics found.
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Create a rubric to start grading subjective assignments.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {rubrics.map((rubric) => (
                        <Grid item xs={12} md={6} lg={4} key={rubric.id}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            mb: 1,
                                        }}
                                    >
                                        <Typography variant="h6" component="h2">
                                            {rubric.name}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            component={Link}
                                            href={`/assessments/rubrics/${rubric.id}/edit/`}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Chip
                                            label={rubric.scope.toUpperCase()}
                                            size="small"
                                            color={
                                                rubric.scope === "global"
                                                    ? "primary"
                                                    : rubric.scope === "program"
                                                      ? "secondary"
                                                      : "default"
                                            }
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={`${rubric.max_score} pts`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        noWrap
                                    >
                                        {rubric.description ||
                                            "No description provided."}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        display="block"
                                        sx={{ mt: 2, color: "text.disabled" }}
                                    >
                                        Updated:{" "}
                                        {new Date(
                                            rubric.updated_at,
                                        ).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </DashboardLayout>
    );
};

export default RubricsIndex;
