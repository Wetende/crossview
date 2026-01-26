
import { Head, Link, useForm, router } from "@inertiajs/react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Stack,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import DeleteIcon from "@mui/icons-material/Delete";
import AttachFileIcon from '@mui/icons-material/AttachFile';

import DashboardLayout from "@/layouts/DashboardLayout";
import { useState } from "react";

export default function ProgramContent({
    program,
    initialData = {},
    courseLevels = [],
    categories = [],
    resources = [],
}) {
    // using useForm from inertia to handle file uploads better (forceFormData option if needed)
    const { data, setData, post, processing, errors, progress } = useForm({
        description: initialData.description || "",
        category: initialData.category || "",
        level: initialData.level || "beginner",
        whatYouLearn: initialData.whatYouLearn || "", // Now a string (TextArea)
        thumbnail: null,
        materials: [], // Array of new files to upload
    });

    const [thumbnailPreview, setThumbnailPreview] = useState(program.thumbnailUrl);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Post with forceFormData: true to handle files
        post(`/admin/programs/${program.id}/content/`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                // Clear file inputs on success
                setData(prev => ({ ...prev, thumbnail: null, materials: [] }));
            }
        });
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("thumbnail", file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleMaterialsChange = (e) => {
        const files = Array.from(e.target.files);
        setData("materials", [...data.materials, ...files]);
    };

    const removeMaterial = (index) => {
        const newMaterials = data.materials.filter((_, i) => i !== index);
        setData("materials", newMaterials);
    };

    const hasCategories = categories && categories.length > 0;

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[
                { label: "Programs", href: "/admin/programs/" },
                { label: program.name, href: `/admin/programs/${program.id}/` },
                { label: "Content Setup" },
            ]}
        >
            <Head title={`Content Setup: ${program.name}`} />

            <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Button
                                component={Link}
                                href={`/admin/programs/${program.id}/`}
                                startIcon={<ArrowBackIcon />}
                                sx={{ mb: 1 }}
                            >
                                Back to Program
                            </Button>
                            <Typography variant="h4" fontWeight="bold">
                                Program Content Setup
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Define general information, uploads, and learning outcomes.
                            </Typography>
                        </Box>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            size="large"
                            disabled={processing}
                        >
                            {processing ? "Saving..." : "Save & Finish"}
                        </Button>
                    </Box>

                    {/* Progress Bar for Uploads */}
                    {progress && (
                         <Box sx={{ width: '100%', mb: 2 }}>
                            <progress value={progress.percentage} max="100">
                                {progress.percentage}%
                            </progress>
                         </Box>
                    )}

                    <Grid container spacing={3}>
                        {/* Left Column: General Info & Thumbnail */}
                        <Grid item xs={12} md={7}>
                            <Stack spacing={3}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                General Information
                                            </Typography>
                                            <Stack spacing={3}>
                                                {/* Category: Only show if categories exist */}
                                                {hasCategories && (
                                                    <FormControl fullWidth>
                                                        <InputLabel>Category</InputLabel>
                                                        <Select
                                                            value={data.category}
                                                            label="Category"
                                                            onChange={(e) => setData("category", e.target.value)}
                                                        >
                                                            <MenuItem value=""><em>None</em></MenuItem>
                                                            {categories.map((cat) => (
                                                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}

                                                <FormControl fullWidth>
                                                    <InputLabel>Level</InputLabel>
                                                    <Select
                                                        value={data.level}
                                                        label="Level"
                                                        onChange={(e) => setData("level", e.target.value)}
                                                    >
                                                        {courseLevels.map((lvl) => (
                                                            <MenuItem key={lvl.value} value={lvl.value}>{lvl.label}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                <TextField
                                                    label="Description"
                                                    value={data.description}
                                                    onChange={(e) => setData("description", e.target.value)}
                                                    multiline
                                                    rows={6}
                                                    fullWidth
                                                    placeholder="Enter a detailed description of the program..."
                                                    helperText="This will be displayed on the program details page."
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Thumbnail Upload */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Course Thumbnail
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                {thumbnailPreview ? (
                                                    <Box 
                                                        component="img" 
                                                        src={thumbnailPreview} 
                                                        sx={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 1, bgcolor: 'grey.200' }} 
                                                    />
                                                ) : (
                                                    <Box 
                                                        sx={{ width: 120, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1 }}
                                                    >
                                                        <InsertPhotoIcon color="disabled" />
                                                    </Box>
                                                )}
                                                
                                                <Button
                                                    component="label"
                                                    variant="outlined"
                                                    startIcon={<UploadFileIcon />}
                                                >
                                                    Upload Image
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={handleThumbnailChange}
                                                    />
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Stack>
                        </Grid>

                        {/* Right Column: Syllabus & Materials */}
                        <Grid item xs={12} md={5}>
                             <Stack spacing={3}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                What You'll Learn
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Paste your learning outcomes here, one per line. They will be formatted as a list automatically.
                                            </Typography>
                                            
                                            <TextField
                                                value={data.whatYouLearn}
                                                onChange={(e) => setData("whatYouLearn", e.target.value)}
                                                multiline
                                                rows={8}
                                                fullWidth
                                                placeholder={`• Understand the basics of...\n• Learn how to appy...\n• Master the core concepts...`}
                                            />
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Course Materials / Resources */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Course Materials
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                Upload resources for instructors (Syllabus PDF, Reading Lists, etc.).
                                            </Typography>

                                            <Button
                                                component="label"
                                                variant="outlined"
                                                fullWidth
                                                startIcon={<AttachFileIcon />}
                                                sx={{ mb: 2, height: 50, borderStyle: 'dashed' }}
                                            >
                                                Click to Attach Files (PDF, Docx)
                                                <input
                                                    type="file"
                                                    hidden
                                                    multiple
                                                    onChange={handleMaterialsChange}
                                                />
                                            </Button>

                                            {/* Existing Resources List */}
                                            {resources.length > 0 && (
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="subtitle2" gutterBottom>Existing Resources</Typography>
                                                    <Stack spacing={1}>
                                                        {resources.map((res) => (
                                                            <Box key={res.id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                                                                <AttachFileIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                                                <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                                        {res.title}
                                                                    </a>
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* New Uploads List */}
                                            {data.materials.length > 0 && (
                                                <Box>
                                                    <Typography variant="subtitle2" gutterBottom>New Uploads</Typography>
                                                    <Stack spacing={1}>
                                                        {data.materials.map((file, index) => (
                                                            <Box key={index} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="body2" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {file.name}
                                                                </Typography>
                                                                <IconButton size="small" onClick={() => removeMaterial(index)}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </Box>
        </DashboardLayout>
    );
}
