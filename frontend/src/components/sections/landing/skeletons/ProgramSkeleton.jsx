import { Grid, Box, Skeleton, Stack } from "@mui/material";

export default function ProgramSkeleton() {
    return (
        <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "#FAFAFA" }}>
            <Stack spacing={2} alignItems="center" sx={{ mb: 8 }}>
                <Skeleton variant="rounded" width={120} height={24} />
                <Skeleton variant="text" width={300} height={60} />
                <Skeleton variant="text" width={500} height={24} />
            </Stack>
            <Grid container spacing={4}>
                {[1, 2, 3].map((item) => (
                    <Grid item xs={12} md={4} key={item}>
                        <Box
                            sx={{
                                height: 400,
                                borderRadius: 4,
                                bgcolor: "white",
                                overflow: "hidden",
                            }}
                        >
                            <Skeleton variant="rectangular" height={200} />
                            <Box sx={{ p: 3 }}>
                                <Skeleton
                                    variant="text"
                                    width="60%"
                                    height={32}
                                    sx={{ mb: 1 }}
                                />
                                <Skeleton
                                    variant="text"
                                    width="40%"
                                    height={24}
                                    sx={{ mb: 2 }}
                                />
                                <Skeleton variant="text" width="90%" />
                                <Skeleton variant="text" width="80%" />
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
