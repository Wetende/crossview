import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Stack,
    Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function PresetsIndex({ presets }) {
    return (
        <DashboardLayout role="superadmin">
            <Head title="Preset Blueprints" />

            <Stack spacing={3}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Box>
                        <Typography variant="h4">Preset Blueprints</Typography>
                        <Typography color="text.secondary">
                            Pre-configured academic structures for regulatory
                            compliance
                        </Typography>
                    </Box>
                    <Link href="/superadmin/presets/create/">
                        <Button variant="contained" startIcon={<AddIcon />}>
                            Add Preset
                        </Button>
                    </Link>
                </Stack>

                <Grid container spacing={3}>
                    {presets?.map((preset, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={preset.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <Typography variant="h6">
                                                    {preset.name}
                                                </Typography>
                                                <Chip
                                                    label={
                                                        preset.isActive
                                                            ? "Active"
                                                            : "Inactive"
                                                    }
                                                    color={
                                                        preset.isActive
                                                            ? "success"
                                                            : "default"
                                                    }
                                                    size="small"
                                                />
                                            </Stack>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Code: {preset.code}
                                            </Typography>

                                            {preset.regulatoryBody && (
                                                <Typography
                                                    variant="body2"
                                                    color="primary"
                                                >
                                                    {preset.regulatoryBody}
                                                </Typography>
                                            )}

                                            {preset.description && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {preset.description}
                                                </Typography>
                                            )}

                                            <Box>
                                                <Typography
                                                    variant="subtitle2"
                                                    gutterBottom
                                                >
                                                    Hierarchy
                                                </Typography>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    flexWrap="wrap"
                                                    useFlexGap
                                                >
                                                    {preset.hierarchyLabels?.map(
                                                        (label, i) => (
                                                            <Chip
                                                                key={i}
                                                                label={label}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ),
                                                    )}
                                                </Stack>
                                            </Box>

                                            <Link
                                                href={`/superadmin/presets/${preset.id}/edit/`}
                                            >
                                                <Button
                                                    fullWidth
                                                    variant="outlined"
                                                >
                                                    Edit Preset
                                                </Button>
                                            </Link>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}

                    {(!presets || presets.length === 0) && (
                        <Grid size={{ xs: 12 }}>
                            <Card>
                                <CardContent
                                    sx={{ textAlign: "center", py: 4 }}
                                >
                                    <Typography color="text.secondary">
                                        No presets configured yet
                                    </Typography>
                                    <Link href="/superadmin/presets/create/">
                                        <Button sx={{ mt: 2 }}>
                                            Create First Preset
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Stack>
        </DashboardLayout>
    );
}
