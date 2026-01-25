import { Grid, Box, Skeleton, Stack } from "@mui/material";

export default function CardGridSkeleton({ count = 3, height = 300 }) {
    return (
        <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "white" }}>
            <Stack spacing={2} alignItems="center" sx={{ mb: 8 }}>
                <Skeleton variant="rounded" width={120} height={24} />
                <Skeleton variant="text" width={300} height={60} />
                <Skeleton variant="text" width={500} height={24} />
            </Stack>
            <Grid container spacing={3} justifyContent="center">
                {Array.from({ length: count }).map((_, idx) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                        <Box
                            sx={{
                                height,
                                borderRadius: 4,
                                bgcolor: "white",
                                p: 4,
                                boxShadow: 1,
                            }}
                        >
                            <Stack alignItems="center" spacing={2}>
                                <Skeleton
                                    variant="circular"
                                    width={64}
                                    height={64}
                                />
                                <Skeleton
                                    variant="text"
                                    width="70%"
                                    height={32}
                                />
                                <Skeleton variant="text" width="90%" />
                                <Skeleton variant="text" width="85%" />
                                <Skeleton variant="text" width="60%" />
                            </Stack>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
