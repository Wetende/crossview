import {
    Box,
    Container,
    Typography,
    Stack,
    TextField,
    Button,
    Card,
    Grid,
    useTheme,
    useMediaQuery,
} from "@mui/material";

export default function CTANewsletterSection() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    
    // User requested colors
    const darkBlue = "#0b30e5"; // Distinct blue specified by user
    const amberColor = "#FBBF24"; // "Our amber" - closely matching the screenshot's rich yellow/amber
    const rightSideBg = "#9AA0B1"; // Muted grayish-purple from the screenshot
    
    return (
        <Box component="section" sx={{ display: "flex", flexDirection: "column" }}>
            
            {/* Top Area: Split Background with Info & Form */}
            <Box 
                sx={{ 
                    position: "relative",
                    background: isMobile 
                        ? darkBlue 
                        : `linear-gradient(100deg, ${darkBlue} 0%, ${darkBlue} 50%, ${rightSideBg} 50%, ${rightSideBg} 100%)`,
                    pt: { xs: 4, md: 5 },
                    pb: { xs: 4, md: 5 },
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        
                        {/* Left Side: Copy */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ pr: { md: 6 }, color: "white", textAlign: { xs: "center", md: "left" } }}>
                                <Typography 
                                    variant="h3" 
                                    fontWeight={700} 
                                    lineHeight={1.3}
                                    sx={{ mb: 2 }}
                                >
                                    Ready to master robotics, coding, or AI?
                                </Typography>
                                
                                {/* Small amber separator line */}
                                <Box 
                                    sx={{ 
                                        width: 60, 
                                        height: 3, 
                                        bgcolor: amberColor, 
                                        mx: { xs: "auto", md: 0 },
                                        mb: 4,
                                        mt: 2
                                    }} 
                                />
                                
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                                    Learn from expert instructors. Build real projects. Join a community of young African innovators.
                                </Typography>
                                
                                <Typography variant="subtitle1" fontWeight={500} color={amberColor}>
                                    Start your tech journey today—your future begins now.
                                </Typography>
                            </Box>
                        </Grid>
                        
                        {/* Right Side: Form Card */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box 
                                sx={{ 
                                    // On mobile, give it the background color manually since the parent gradient is disabled
                                    ...(isMobile && { bgcolor: rightSideBg, mx: -2, px: 2, py: 6, borderRadius: 2 }),
                                    display: "flex", 
                                    justifyContent: { xs: "center", md: "flex-end" }
                                }}
                            >
                                <Card 
                                    elevation={4} 
                                    sx={{ 
                                        p: { xs: 4, sm: 5 }, 
                                        width: "100%", 
                                        maxWidth: 420, 
                                        borderRadius: 2,
                                        bgcolor: "white" 
                                    }}
                                >
                                    <Typography variant="h4" fontWeight={800} align="center" color="#1F2937" sx={{ mb: 4 }}>
                                        Sign up now
                                    </Typography>
                                    
                                    <Stack spacing={2.5}>
                                        <TextField 
                                            variant="filled"
                                            placeholder="What's your name..." 
                                            fullWidth
                                            size="small"
                                            InputProps={{ disableUnderline: true, sx: { bgcolor: "#F3F4F6", borderRadius: 1 } }}
                                        />
                                        <TextField 
                                            variant="filled"
                                            placeholder="What's your email..." 
                                            fullWidth
                                            size="small"
                                            InputProps={{ disableUnderline: true, sx: { bgcolor: "#F3F4F6", borderRadius: 1 } }}
                                        />
                                        <TextField 
                                            variant="filled"
                                            placeholder="Phone..." 
                                            fullWidth
                                            size="small"
                                            InputProps={{ disableUnderline: true, sx: { bgcolor: "#F3F4F6", borderRadius: 1 } }}
                                        />
                                        <Button 
                                            variant="contained" 
                                            fullWidth 
                                            sx={{ 
                                                bgcolor: darkBlue,
                                                color: "white",
                                                py: 1.5,
                                                mt: 2,
                                                fontWeight: 700,
                                                fontSize: "1rem",
                                                borderRadius: 1,
                                                "&:hover": {
                                                    bgcolor: "#0825b5",
                                                }
                                            }}
                                        >
                                            GET IT!
                                        </Button>
                                    </Stack>
                                </Card>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
            
            {/* Bottom Area: Newsletter */}
            <Box sx={{ bgcolor: amberColor, py: 6 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Typography variant="h6" fontWeight={800} color="#0b30e5" sx={{ mb: 1.5 }}>
                                SUBSCRIBE OUR NEWSLETTER
                            </Typography>
                            <Typography variant="body2" color="#4B5563" sx={{ maxWidth: 600, lineHeight: 1.6 }}>
                                Stay updated on our latest courses, bootcamps, and tech hubs. Join us in empowering 1 million young Africans to lead the digital revolution.
                            </Typography>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="#4B5563" sx={{ mb: 1, textTransform: "uppercase", fontSize: "0.75rem" }}>
                                    Your e-mail address
                                </Typography>
                                <Stack direction="row" spacing={0} sx={{ height: 48 }}>
                                    <TextField 
                                        variant="filled"
                                        placeholder="Enter email..." 
                                        fullWidth
                                        InputProps={{ 
                                            disableUnderline: true, 
                                            sx: { 
                                                bgcolor: "#F3F4F6", // Grey background for input
                                                borderRight: "none",
                                                height: "100%",
                                                "& input": { color: "#1F2937", py: 0, px: 2, height: "100%" }
                                            } 
                                        }}
                                        sx={{ 
                                            "& .MuiFilledInput-root": { borderRadius: 0 } 
                                        }}
                                    />
                                    <Button 
                                        variant="contained"
                                        sx={{ 
                                            bgcolor: darkBlue,
                                            borderRadius: 0,
                                            px: 4,
                                            fontWeight: 700,
                                            "&:hover": { bgcolor: "#0825b5" }
                                        }}
                                    >
                                        SUBSCRIBE
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
            
        </Box>
    );
}
