import { useEffect, useState } from "react";
import {
    Box,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from "@mui/material";

export default function ImageMatchingQuestion({
    question,
    onChange,
    value = null,
}) {
    const left = Array.isArray(question.left_items) ? question.left_items : [];
    const right = Array.isArray(question.right_items)
        ? question.right_items
        : [];

    const [selections, setSelections] = useState(value || {});

    useEffect(() => {
        setSelections(value || {});
    }, [question?.id, value]);

    const rightById = new Map(right.map((item) => [String(item.id), item]));

    const handleSelect = (leftId, rightId) => {
        const next = {
            ...selections,
            [String(leftId)]: rightId ? String(rightId) : "",
        };
        setSelections(next);
        onChange(next);
    };

    return (
        <Box>
            <Typography fontWeight="medium" gutterBottom>
                {question.text}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
                {left.map((l) => {
                    const leftId = String(l.id);
                    const selectedRightId = selections[leftId]
                        ? String(selections[leftId])
                        : "";
                    const selected = selectedRightId
                        ? rightById.get(selectedRightId)
                        : null;
                    return (
                        <Paper
                            key={leftId}
                            variant="outlined"
                            sx={{
                                p: 2,
                                display: "flex",
                                gap: 2,
                                alignItems: "stretch",
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {l.image && (
                                    <Box sx={{ mb: 1 }}>
                                        <img
                                            loading="lazy" src={l.image}
                                            alt="Question"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: 180,
                                                objectFit: "contain",
                                            }}
                                        />
                                    </Box>
                                )}
                                {l.text && <Typography>{l.text}</Typography>}
                            </Box>

                            <Box sx={{ width: 320, maxWidth: "45%" }}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        displayEmpty
                                        value={selectedRightId}
                                        onChange={(e) =>
                                            handleSelect(leftId, e.target.value)
                                        }
                                    >
                                        <MenuItem value="">
                                            <em>Select match...</em>
                                        </MenuItem>
                                        {right.map((r) => (
                                            <MenuItem
                                                key={String(r.id)}
                                                value={String(r.id)}
                                            >
                                                {r.text || r.id}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {selected?.image && (
                                    <Box sx={{ mt: 1 }}>
                                        <img
                                            loading="lazy" src={selected.image}
                                            alt="Selected answer"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: 180,
                                                objectFit: "contain",
                                            }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}
