/**
 * NodeEditor Component
 * Form for creating/editing curriculum nodes
 * Requirements: FR-4.3, FR-4.4
 * Uses Inertia router.post() for mutations.
 * Uses axios for sequential block saves (race condition prevention).
 */

import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios"; // Required for sequential block saves
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    FormControlLabel,
    Switch,
    Divider,
    Chip,
    Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import BlockManager from "./ContentBlocks/BlockManager";

export default function NodeEditor({
    mode = "create",
    node = null,
    nodeType = "",
    parentNode = null,
    hierarchy = [],
    initialBlocks = [], // Blocks now passed as props from backend
    onSave,
    onDelete,
    onCancel,
}) {
    const isCreate = mode === "create";

    const [formData, setFormData] = useState({
        title: "",
        code: "",
        description: "",
        nodeType: nodeType,
        isPublished: false,
        properties: {},
        completionRules: {},
    });

    const [saving, setSaving] = useState(false);

    // Map initial blocks from backend format to frontend format
    const mapBlocks = (rawBlocks) => {
        return (rawBlocks || []).map((b) => ({
            id: b.id,
            type: b.block_type,
            position: b.position,
            metadata: b.data,
        }));
    };

    const [blocks, setBlocks] = useState(mapBlocks(initialBlocks));
    const [blocksLoaded, setBlocksLoaded] = useState(
        initialBlocks.length > 0 || isCreate,
    );

    // Initialize form data when node changes
    useEffect(() => {
        if (node) {
            setFormData({
                title: node.title || "",
                code: node.code || "",
                description: node.description || "",
                nodeType: node.nodeType || "",
                isPublished: node.isPublished || false,
                properties: node.properties || {},
                completionRules: node.completionRules || {},
            });
            // Use blocks from props if available
            if (initialBlocks.length > 0) {
                setBlocks(mapBlocks(initialBlocks));
                setBlocksLoaded(true);
            }
        } else {
            setFormData({
                title: "",
                code: "",
                description: "",
                nodeType: nodeType,
                isPublished: false,
                properties: {},
                completionRules: {},
            });
            setBlocks([]);
        }
    }, [node, nodeType, initialBlocks]);

    const handleChange = (field) => (e) => {
        const value =
            e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // 1. Save Node Metadata first
            await onSave(formData);

            // 2. Save Blocks (if node exists or was created)
            // Since onSave usually returns the node or we have it, we might need the ID.
            // For now, assuming editing existing node:
            if (node) {
                await saveBlocks(node.id, blocks);
            }
        } finally {
            setSaving(false);
        }
    };

    const saveBlocks = async (nodeId, currentBlocks) => {
        // Use axios for sequential block saves - router.post() is fire-and-forget
        // which causes race conditions with the reorder call
        const savedBlockIds = [];

        for (const block of currentBlocks) {
            const payload = {
                node: nodeId,
                block_type: block.type,
                position: block.position,
                data: block.metadata,
            };

            try {
                if (
                    typeof block.id === "string" &&
                    block.id.startsWith("temp-")
                ) {
                    // Create new block
                    const response = await axios.post(
                        "/api/content/blocks/",
                        payload,
                    );
                    savedBlockIds.push(response.data.id);
                } else {
                    // Update existing block
                    await axios.patch(
                        `/api/content/blocks/${block.id}/`,
                        payload,
                    );
                    savedBlockIds.push(block.id);
                }
            } catch (error) {
                console.error("Failed to save block:", error);
            }
        }

        // Reorder all saved blocks
        if (savedBlockIds.length > 0) {
            try {
                await axios.post("/api/content/blocks/reorder/", {
                    node_id: nodeId,
                    order: savedBlockIds,
                });
            } catch (error) {
                console.error("Failed to reorder blocks:", error);
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Typography variant="h6">
                            {isCreate ? "Create" : "Edit"}{" "}
                            {formData.nodeType || "Node"}
                        </Typography>
                        {parentNode && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Parent: {parentNode.title}
                            </Typography>
                        )}
                    </Box>
                    <Chip
                        label={formData.nodeType}
                        color="primary"
                        variant="outlined"
                        size="small"
                    />
                </Box>

                <Divider />

                {/* Basic Fields */}
                <TextField
                    label="Title"
                    value={formData.title}
                    onChange={handleChange("title")}
                    required
                    fullWidth
                    autoFocus
                />

                <TextField
                    label="Code"
                    value={formData.code}
                    onChange={handleChange("code")}
                    fullWidth
                    helperText="Optional unique identifier"
                />

                <TextField
                    label="Description"
                    value={formData.description}
                    onChange={handleChange("description")}
                    multiline
                    rows={3}
                    fullWidth
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.isPublished}
                            onChange={handleChange("isPublished")}
                        />
                    }
                    label="Published"
                />

                <Divider />

                {/* Completion Rules (simplified) */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Completion Rules
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Define how students complete this node
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={
                                        formData.completionRules
                                            ?.requireAllChildren || false
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            completionRules: {
                                                ...prev.completionRules,
                                                requireAllChildren:
                                                    e.target.checked,
                                            },
                                        }))
                                    }
                                />
                            }
                            label="Require all children to be completed"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={
                                        formData.completionRules
                                            ?.requireAssessment || false
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            completionRules: {
                                                ...prev.completionRules,
                                                requireAssessment:
                                                    e.target.checked,
                                            },
                                        }))
                                    }
                                />
                            }
                            label="Require assessment completion"
                        />
                    </Stack>
                </Box>

                <Divider />

                {/* Content Blocks (Only for Session/Lesson types) */}
                {(formData.nodeType === "Session" ||
                    formData.nodeType === "Lesson") && (
                    <Box>
                        <BlockManager
                            blocks={blocks}
                            onBlocksChange={setBlocks}
                        />
                    </Box>
                )}

                <Divider />

                {/* Actions */}
                <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="space-between"
                >
                    <Box>
                        {!isCreate && onDelete && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={onDelete}
                            >
                                Delete
                            </Button>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={saving || !formData.title.trim()}
                        >
                            {saving
                                ? "Saving..."
                                : isCreate
                                  ? "Create"
                                  : "Save"}
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Box>
    );
}
