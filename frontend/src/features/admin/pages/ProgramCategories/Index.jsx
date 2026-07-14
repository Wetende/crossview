import { Head, Link, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import SchoolIcon from "@mui/icons-material/School";

import DashboardLayout from "@/layouts/DashboardLayout";

const normalizeCategory = (value) => value.trim().replace(/\s+/g, " ");

export default function ProgramCategoriesIndex({
    categories = [],
    uncategorizedProgramCount = 0,
}) {
    const initialCategories = useMemo(
        () => categories.map((category) => category.name).filter(Boolean),
        [categories],
    );
    const usageByCategory = useMemo(
        () =>
            categories.reduce((usage, category) => {
                usage[category.name] = category.programCount || 0;
                return usage;
            }, {}),
        [categories],
    );

    const { data, setData, post, processing, errors } = useForm({
        programCategories: initialCategories,
    });
    const [newCategory, setNewCategory] = useState("");

    const addCategory = () => {
        const nextCategory = normalizeCategory(newCategory);
        if (!nextCategory) {
            return;
        }
        if (data.programCategories.includes(nextCategory)) {
            setNewCategory("");
            return;
        }

        setData("programCategories", [...data.programCategories, nextCategory]);
        setNewCategory("");
    };

    const removeCategory = (categoryToRemove) => {
        setData(
            "programCategories",
            data.programCategories.filter(
                (category) => category !== categoryToRemove,
            ),
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        post("/admin/program-categories/", {
            preserveScroll: true,
        });
    };

    const handleCategoryKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addCategory();
        }
    };

    const totalAssignedPrograms = data.programCategories.reduce(
        (total, category) => total + (usageByCategory[category] || 0),
        0,
    );

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[
                { label: "Programs", href: "/admin/programs/" },
                { label: "Categories" },
            ]}
        >
            <Head title="Program Categories" />

            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", md: "center" },
                        gap: 2,
                        flexDirection: { xs: "column", md: "row" },
                    }}
                >
                    <Box>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <CategoryIcon color="primary" />
                            <Typography variant="h4" fontWeight="bold">
                                Program Categories
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            Manage the academic categories available on program forms.
                        </Typography>
                    </Box>
                    <Button
                        component={Link}
                        href="/admin/programs/"
                        variant="outlined"
                        startIcon={<SchoolIcon />}
                    >
                        Programs
                    </Button>
                </Box>

                {errors.programCategories && (
                    <Alert severity="error">{errors.programCategories}</Alert>
                )}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: "minmax(0, 1fr) 320px",
                        },
                        gap: 3,
                    }}
                >
                    <Card>
                        <CardContent>
                            <Stack spacing={2.5}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1.5}
                                >
                                    <TextField
                                        label="Category name"
                                        value={newCategory}
                                        onChange={(event) =>
                                            setNewCategory(event.target.value)
                                        }
                                        onKeyDown={handleCategoryKeyDown}
                                        fullWidth
                                    />
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        startIcon={<AddIcon />}
                                        onClick={addCategory}
                                        sx={{
                                            minWidth: { xs: "100%", sm: 120 },
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Stack>

                                <Divider />

                                {data.programCategories.length > 0 ? (
                                    <List disablePadding>
                                        {data.programCategories.map((category) => {
                                            const programCount =
                                                usageByCategory[category] || 0;
                                            return (
                                                <ListItem
                                                    key={category}
                                                    disableGutters
                                                    secondaryAction={
                                                        <IconButton
                                                            edge="end"
                                                            aria-label={`Remove ${category}`}
                                                            onClick={() =>
                                                                removeCategory(category)
                                                            }
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    }
                                                    sx={{
                                                        py: 1.25,
                                                        borderBottom: 1,
                                                        borderColor: "divider",
                                                        "&:last-of-type": {
                                                            borderBottom: 0,
                                                        },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={category}
                                                        secondary={`${programCount} program${
                                                            programCount === 1
                                                                ? ""
                                                                : "s"
                                                        }`}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                ) : (
                                    <Alert severity="warning">
                                        Add at least one category before saving.
                                    </Alert>
                                )}

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        disabled={
                                            processing ||
                                            data.programCategories.length === 0
                                        }
                                    >
                                        {processing ? "Saving..." : "Save categories"}
                                    </Button>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" fontWeight={700}>
                                    Summary
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip
                                        label={`${data.programCategories.length} categories`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${totalAssignedPrograms} assigned`}
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${uncategorizedProgramCount} uncategorized`}
                                        color={
                                            uncategorizedProgramCount > 0
                                                ? "warning"
                                                : "default"
                                        }
                                        variant="outlined"
                                    />
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Stack>
        </DashboardLayout>
    );
}
