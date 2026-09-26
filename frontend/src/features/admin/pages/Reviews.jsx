import { Head, router } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import DOMPurify from "dompurify";
import DashboardLayout from "@/layouts/DashboardLayout";

export default function Reviews({
    reviews = [],
    filters = {},
    statusOptions = [],
}) {
    const status = filters?.status || "pending";

    return (
        <DashboardLayout role="admin" breadcrumbs={[{ label: "Reviews" }]}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Head title="Review Moderation" />
                <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Review Moderation
                    </Typography>
                    <Select
                        size="small"
                        value={status}
                        onChange={(e) =>
                            router.get("/admin/reviews/", {
                                status: e.target.value,
                            })
                        }
                    >
                        {statusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>

                <Stack spacing={2}>
                    {reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {review.program?.name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        By {review.user?.name} • Rating {review.rating}/5 • Status {review.status}
                                    </Typography>
                                    <Box
                                        sx={{
                                            border: 1,
                                            borderColor: "divider",
                                            borderRadius: 1,
                                            p: 1.5,
                                        }}
                                    >
                                        {review.reviewText ? (
                                            <Typography
                                                variant="body2"
                                                component="div"
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurify.sanitize(review.reviewText),
                                                }}
                                            />
                                        ) : (
                                            <Typography variant="body2">
                                                No review text provided.
                                            </Typography>
                                        )}
                                    </Box>
                                    <TextField
                                        size="small"
                                        placeholder="Moderation note (optional)"
                                        defaultValue={review.moderationNote || ""}
                                        onChange={() => {}}
                                        slotProps={{ htmlInput: { "data-note-id": review.id } }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                const input = document.querySelector(
                                                    `[data-note-id='${review.id}']`,
                                                );
                                                router.post(`/admin/reviews/${review.id}/approve/`, {
                                                    moderation_note: input?.value || "",
                                                });
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => {
                                                const input = document.querySelector(
                                                    `[data-note-id='${review.id}']`,
                                                );
                                                router.post(`/admin/reviews/${review.id}/reject/`, {
                                                    moderation_note: input?.value || "",
                                                });
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}

                    {reviews.length === 0 && (
                        <Typography color="textSecondary">
                            No reviews in this queue.
                        </Typography>
                    )}
                </Stack>
            </Container>
        </DashboardLayout>
    );
}
