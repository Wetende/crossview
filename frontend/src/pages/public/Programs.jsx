import { Head, router, usePage } from "@inertiajs/react";
import {
  Box,
  Container,
  Typography,
  Stack,
  useTheme,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
} from "@mui/material";
import { IconSearch, IconBook } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import { Fragment, useEffect, useState } from "react";
import ProgramGrid from "../../components/lists/ProgramGrid";
import PublicNavbar from "../../components/common/PublicNavbar";
import Footer from "@/components/common/Footer";
import { getProgramsListState } from "./programsState";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

const PROGRAMS_ONLY_PROPS = ["programs", "groupedPrograms", "filters", "pagination"];

export default function Programs({
  programs = [],
  groupedPrograms = [],
  courseLevels = [],
  filters = {},
  categories = [],
  userEnrollments = [],
  userPendingRequests = [],
  pagination = {},
}) {
  const theme = useTheme();
  const { auth, platform } = usePage().props;
  const institutionName = platform?.institutionName || 'LMS';
  const [search, setSearch] = useState(filters.search || "");
  const [selectedCategory, setSelectedCategory] = useState(
    filters.category || "",
  );
  const [selectedLevel, setSelectedLevel] = useState(filters.level || "");
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  useEffect(() => {
    setSearch(filters.search || "");
    setSelectedCategory(filters.category || "");
    setSelectedLevel(filters.level || "");
  }, [filters.category, filters.level, filters.search]);

  const groupsToRender =
    groupedPrograms && groupedPrograms.length > 0
      ? groupedPrograms
      : [{ value: "all", label: "All Programs", programs }];
  const groupedProgramIds = new Set(
    groupsToRender.flatMap((group) => (group.programs || []).map((program) => program.id)),
  );
  const ungroupedPrograms = programs.filter((program) => !groupedProgramIds.has(program.id));

  const totalPrograms = groupsToRender.reduce(
    (total, group) => total + (group.programs || []).length,
    ungroupedPrograms.length,
  );
  const listState = getProgramsListState({
    filters,
    isLoadingPrograms,
    totalPrograms,
  });

  const visitPrograms = (params, options = {}) => {
    const queryString = params.toString();
    const url = queryString ? `/programs/?${queryString}` : "/programs/";

    router.get(url, {}, {
      preserveState: true,
      replace: true,
      only: PROGRAMS_ONLY_PROPS,
      onStart: () => setIsLoadingPrograms(true),
      onFinish: () => setIsLoadingPrograms(false),
      onCancel: () => setIsLoadingPrograms(false),
      onError: () => setIsLoadingPrograms(false),
      ...options,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedLevel) params.set("level", selectedLevel);
    visitPrograms(params);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (selectedLevel) params.set("level", selectedLevel);
    visitPrograms(params);
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (level) params.set("level", level);
    visitPrograms(params);
  };

  const handlePageChange = (event, page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedLevel) params.set("level", selectedLevel);
    if (page > 1) params.set("page", page);
    visitPrograms(params, { preserveScroll: true });
  };

  return (
    <>
      <Head title={`Academic Programs - ${institutionName}`} />

      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f5f7fa",
          overflowX: "hidden",
        }}
      >
        {/* Navbar */}
        <PublicNavbar activeLink="/programs/" auth={auth} />

        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            pt: { xs: 16, md: 20 },
            pb: { xs: 4, md: 6 },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: getBackgroundDots(
                theme.palette.grey[300],
                2,
                30,
              ),
              zIndex: -1,
              maskImage:
                "linear-gradient(to bottom, black 0%, transparent 100%)",
            }}
          />
          <Container maxWidth="lg">
            <motion.div {...fadeInUp}>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Explore Courses
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 600, mb: 4, fontWeight: 400 }}
              >
                Discover our diverse range of programs designed to equip you
                with skills for the future.
              </Typography>

              {/* Search & Filter Row */}
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ maxWidth: 700 }}
              >
                <Box component="form" onSubmit={handleSearch} sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    disabled={isLoadingPrograms}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSearch
                            size={20}
                            color={theme.palette.text.secondary}
                          />
                        </InputAdornment>
                      ),
                      sx: {
                        bgcolor: "background.paper",
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
                {categories.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      displayEmpty
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      disabled={isLoadingPrograms}
                      sx={{
                        bgcolor: "background.paper",
                        borderRadius: 2,
                      }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {courseLevels.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      displayEmpty
                      value={selectedLevel}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      disabled={isLoadingPrograms}
                      sx={{
                        bgcolor: "background.paper",
                        borderRadius: 2,
                      }}
                    >
                      <MenuItem value="">All Levels</MenuItem>
                      {courseLevels.map((lvl) => (
                        <MenuItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>
            </motion.div>
          </Container>
        </Box>

        {/* Programs Grid */}
        <Container maxWidth="lg" sx={{ pb: 12 }} aria-busy={isLoadingPrograms}>
          {listState.kind !== "ready" ? (
            <Box sx={{ textAlign: "center", py: 10 }}>
              {listState.kind === "loading" ? (
                <CircularProgress size={42} thickness={4} />
              ) : (
                <IconBook size={48} color={theme.palette.grey[400]} />
              )}
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                {listState.message}
              </Typography>
              {listState.showClearFilters && (
                <Button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("");
                    setSelectedLevel("");
                    visitPrograms(new URLSearchParams());
                  }}
                  sx={{ mt: 2 }}
                  disabled={isLoadingPrograms}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={4}>
              {isLoadingPrograms && (
                <Typography variant="body2" color="text.secondary">
                  Updating programs...
                </Typography>
              )}
              {groupsToRender.map((group) => (
                <Fragment key={group.value || group.label}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {group.label}
                    </Typography>
                  </Box>
                  <ProgramGrid
                    programs={group.programs || []}
                    isAuthenticated={!!auth?.user}
                    userEnrollments={userEnrollments}
                    userPendingRequests={userPendingRequests}
                  />
                </Fragment>
              ))}
              {ungroupedPrograms.length > 0 && (
                <ProgramGrid
                  programs={ungroupedPrograms}
                  isAuthenticated={!!auth?.user}
                  userEnrollments={userEnrollments}
                  userPendingRequests={userPendingRequests}
                />
              )}
              {pagination.totalPages > 1 && (
                <Stack direction="row" justifyContent="center" sx={{ pt: 2 }}>
                  <Pagination
                    page={pagination.page || 1}
                    count={pagination.totalPages}
                    color="primary"
                    onChange={handlePageChange}
                    disabled={isLoadingPrograms}
                  />
                </Stack>
              )}
            </Stack>
          )}
        </Container>

        {/* Footer */}
        <Footer />
      </Box>
    </>
  );
}
