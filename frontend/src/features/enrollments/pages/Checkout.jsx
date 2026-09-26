import { Head, router } from "@inertiajs/react";
import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";

export default function Checkout({ program, price, pendingOrder }) {
    const amountDisplay = Number((price?.amountMinor || 0) / 100).toLocaleString();

    return (
        <Container maxWidth="sm" sx={{ py: 5 }}>
            <Head title={`Checkout - ${program?.name || "Program"}`} />
            <Card>
                <CardContent>
                    <Stack spacing={2.5}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Checkout</Typography>
                        <Typography variant="body1">{program?.name}</Typography>
                        <Typography variant="h6">
                            {price?.currency || "KES"} {amountDisplay}
                        </Typography>
                        {pendingOrder?.reference && (
                            <Typography variant="body2" color="textSecondary">
                                Pending order: {pendingOrder.reference}
                            </Typography>
                        )}
                        <Box>
                            <Button
                                variant="contained"
                                onClick={() => router.post(`/programs/${program.id}/checkout/initialize/`)}
                            >
                                Pay with Paystack
                            </Button>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}
