import { useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import DashboardLayout from "@/layouts/DashboardLayout";
import BankScopeChip from "@/features/question-library/components/BankScopeChip";
import QuestionLibraryWorkspace from "@/features/question-library/components/QuestionLibraryWorkspace";
import { errorMessage, promoteBank } from "@/features/question-library/api/questionLibraryApi";

const bankOrigin = (bank) => {
    if (bank.scope === "course") return bank.program_name || "Course";
    return bank.owner_name || "Owner removed";
};

/** Administrators curate shared banks and promote existing banks to shared. */
export default function QuestionBanksIndex({
    banks = [],
    poolCounts = {},
    categories = [],
    tab: initialTab = "shared",
}) {
    const [tab, setTab] = useState(initialTab === "promote" ? "promote" : "shared");
    const [search, setSearch] = useState("");
    const [promoting, setPromoting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const sharedBanks = useMemo(
        () => banks.filter((bank) => bank.scope === "institution"),
        [banks],
    );
    const promotableBanks = useMemo(
        () =>
            banks.filter(
                (bank) =>
                    bank.scope !== "institution" &&
                    bank.name.toLowerCase().includes(search.trim().toLowerCase()),
            ),
        [banks, search],
    );

    const promote = async () => {
        setBusy(true);
        setError("");
        try {
            await promoteBank(promoting.id);
            setPromoting(null);
            router.reload({ only: ["banks", "poolCounts"] });
        } catch (requestError) {
            setError(errorMessage(requestError, "Could not share this bank."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[{ label: "Academic" }, { label: "Question Banks" }]}
        >
            <Head title="Question Banks" />
            <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography variant="h4" component="h1">
                    Question Banks
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
                    Shared banks are available to every instructor in every course. Only
                    administrators can edit them.
                </Typography>
            </Stack>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
                <Tab value="shared" label={`Shared banks (${sharedBanks.length})`} />
                <Tab value="promote" label="Share an existing bank" />
            </Tabs>

            {tab === "shared" && (
                <QuestionLibraryWorkspace
                    banks={sharedBanks}
                    categories={categories}
                    canCreateShared
                    scopes={["institution"]}
                    defaultScope="institution"
                />
            )}

            {tab === "promote" && (
                <Paper variant="outlined">
                    <Box sx={{ p: 2 }}>
                        <TextField
                            size="small"
                            label="Search banks"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            sx={{ maxWidth: 360 }}
                            fullWidth
                        />
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Bank</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Course or owner</TableCell>
                                    <TableCell align="right">Questions</TableCell>
                                    <TableCell align="right">Quiz pools</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {promotableBanks.map((bank) => (
                                    <TableRow key={bank.id}>
                                        <TableCell>{bank.name}</TableCell>
                                        <TableCell>
                                            <BankScopeChip scope={bank.scope} ownedByViewer={false} />
                                        </TableCell>
                                        <TableCell>{bankOrigin(bank)}</TableCell>
                                        <TableCell align="right">{bank.entries_count}</TableCell>
                                        <TableCell align="right">
                                            {poolCounts[String(bank.id)] ?? 0}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" onClick={() => setPromoting(bank)}>
                                                Share with everyone
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {promotableBanks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <Typography color="text.secondary" sx={{ py: 2 }}>
                                                No other banks to share.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Dialog open={Boolean(promoting)} onClose={() => setPromoting(null)} maxWidth="sm" fullWidth>
                <DialogTitle>{`Share “${promoting?.name || ""}” with every instructor?`}</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <DialogContentText>
                        Every instructor will be able to use its questions in any course. Only
                        administrators will be able to edit it, and it will no longer belong to
                        one course or instructor. Quizzes that already use it keep working.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPromoting(null)}>Cancel</Button>
                    <Button variant="contained" onClick={promote} disabled={busy}>
                        Share bank
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
