import { Grid } from "@mui/material";
import { motion } from "framer-motion";
import PublicProgramCard from "../cards/PublicProgramCard";

export default function ProgramGrid({
    programs = [],
    isAuthenticated = false,
    limit,
    columns = { xs: 12, sm: 6, md: 4, lg: 3 },
    userEnrollments = [],
    userPendingRequests = [],
}) {
    const displayPrograms = limit ? programs.slice(0, limit) : programs;

    return (
        <Grid container spacing={3}>
            {displayPrograms.map((program, idx) => {
                const enrollmentStatus = userEnrollments.includes(program.id)
                    ? "enrolled"
                    : userPendingRequests.includes(program.id)
                      ? "pending"
                      : null;

                return (
                    <Grid
                        size={{
                            xs: columns.xs,
                            sm: columns.sm,
                            md: columns.md,
                            lg: columns.lg,
                        }}
                        key={program.id}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                delay: idx * 0.05,
                                duration: 0.5,
                            }}
                        >
                            <PublicProgramCard
                                program={program}
                                isAuthenticated={isAuthenticated}
                                showEnrollButton={true}
                                enrollmentStatus={enrollmentStatus}
                            />
                        </motion.div>
                    </Grid>
                );
            })}
        </Grid>
    );
}
