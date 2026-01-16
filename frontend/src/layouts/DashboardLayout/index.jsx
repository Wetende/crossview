/**
 * Unified Dashboard Layout - Clipped Drawer Pattern
 * Full-width AppBar above sidebar, minimalist navigation
 */

import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
  Box,
  Drawer,
  SwipeableDrawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Breadcrumbs,
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import GradingIcon from '@mui/icons-material/Grading';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';

const DRAWER_WIDTH = 240;
const APPBAR_HEIGHT = 56;

// Navigation menus for each role
const roleNavigation = {
  student: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard/', icon: DashboardIcon },
        { label: 'My Programs', href: '/student/programs/', icon: SchoolIcon },
        { label: 'Assessments', href: '/student/assessments/', icon: AssignmentIcon },
        { label: 'Practicum', href: '/student/practicum/', icon: RateReviewIcon },
        { label: 'Certificates', href: '/student/certificates/', icon: CardMembershipIcon },
        { label: 'Profile', href: '/student/profile/', icon: PersonIcon },
      ],
    },
  ],
  instructor: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard/', icon: DashboardIcon },
      ],
    },
    {
      title: 'Teaching',
      items: [
        { label: 'My Programs', href: '/instructor/programs/', icon: SchoolIcon },
        { label: 'My Students', href: '/instructor/students/', icon: PeopleIcon },
        { label: 'Assignments', href: '/instructor/assignments/', icon: AssignmentIcon },
        { label: 'Gradebook', href: '/instructor/gradebook/', icon: GradingIcon },
        { label: 'Rubrics', href: '/rubrics/', icon: GradingIcon, requiresFeature: 'practicum' },
        { label: 'Practicum Review', href: '/instructor/practicum/', icon: RateReviewIcon, requiresFeature: 'practicum' },
      ],
    },
  ],
  admin: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard/', icon: DashboardIcon },
      ],
    },
    {
      title: 'Academic',
      items: [
        { label: 'Programs', href: '/admin/programs/', icon: SchoolIcon },
        { label: 'Curriculum', href: '/admin/curriculum/', icon: AccountTreeIcon },
        { label: 'Rubrics', href: '/rubrics/', icon: GradingIcon, requiresFeature: 'practicum' },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Users', href: '/admin/users/', icon: PeopleIcon },
        { label: 'Enrollments', href: '/admin/enrollments/', icon: AssignmentIcon },
        { label: 'Certificates', href: '/admin/certificates/', icon: CardMembershipIcon },
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'General', href: '/admin/settings/', icon: SettingsIcon },
      ],
    },
  ],
  superadmin: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard/', icon: DashboardIcon },
        { label: 'Platform Settings', href: '/superadmin/platform/', icon: SettingsIcon },
        { label: 'Blueprints', href: '/superadmin/presets/', icon: ArchitectureIcon },
        { label: 'Users', href: '/admin/users/', icon: PeopleIcon },
        { label: 'Logs', href: '/superadmin/logs/', icon: HistoryIcon },
      ],
    },
  ],
};

const roleColors = {
  student: 'primary',
  instructor: 'success',
  admin: 'warning',
  superadmin: 'error',
};

export default function DashboardLayout({ children, breadcrumbs = [], role: propRole }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { auth, platform } = usePage().props;

  const role = propRole || auth?.user?.role || 'student';
  const navigation = roleNavigation[role] || roleNavigation.student;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const handleDrawerOpen = () => setMobileOpen(true);
  const handleDrawerClose = () => setMobileOpen(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNavClick = () => {
    if (isMobile) handleDrawerClose();
  };

  const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Spacer for AppBar */}
      <Toolbar sx={{ minHeight: APPBAR_HEIGHT }} />
      
      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        {navigation.map((section, sectionIndex) => {
          const filteredItems = section.items.filter((item) => {
            if (!item.requiresFeature) return true;
            return platform?.features?.[item.requiresFeature] === true;
          });
          
          if (filteredItems.length === 0) return null;
          
          return (
            <Box key={sectionIndex}>
              {section.title && (
                <Typography
                  variant="overline"
                  sx={{ 
                    px: 2, 
                    py: 0.5, 
                    display: 'block', 
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {section.title}
                </Typography>
              )}
              <List disablePadding>
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.href ||
                    (item.href !== '/dashboard/' && currentPath.startsWith(item.href));

                  return (
                    <ListItem key={item.href} disablePadding sx={{ px: 1 }}>
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        onClick={handleNavClick}
                        selected={isActive}
                        sx={{
                          borderRadius: 1,
                          minHeight: 32,
                          py: 0,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': { bgcolor: 'primary.dark' },
                            '& .MuiListItemIcon-root': {
                              color: 'primary.contrastText',
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Icon sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ 
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 600 : 400,
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* User Info */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: `${roleColors[role]}.main`, fontSize: 12 }}>
            {auth?.user?.firstName?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight="medium" fontSize="0.8rem">
              {auth?.user?.fullName || auth?.user?.email || 'User'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Full-Width AppBar (Clipped Drawer Pattern) */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: APPBAR_HEIGHT, px: { xs: 1.5, sm: 2 } }}>
          {/* Left: Logo + Hamburger */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              component={Link}
              href="/"
              edge="start"
              sx={{ color: 'primary.main' }}
              aria-label="home"
            >
              <HomeIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              color="primary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {platform?.institutionName || 'Crossview'}
            </Typography>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, ml: 1 }}
              aria-label="toggle menu"
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Breadcrumbs */}
          <Box sx={{ flex: 1, mx: 2 }}>
            {breadcrumbs.length > 0 && (
              <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return crumb.href && !isLast ? (
                    <Link key={index} href={crumb.href} style={{ textDecoration: 'none' }}>
                      <Typography color="text.secondary" variant="body2">{crumb.label}</Typography>
                    </Link>
                  ) : (
                    <Typography key={index} color="text.primary" variant="body2">{crumb.label}</Typography>
                  );
                })}
              </Breadcrumbs>
            )}
          </Box>

          {/* Right: User Menu */}
          <IconButton onClick={handleMenuOpen} aria-label="user menu">
            <Avatar sx={{ width: 32, height: 32, bgcolor: `${roleColors[role]}.main` }}>
              {auth?.user?.firstName?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">{auth?.user?.email}</Typography>
            </MenuItem>
            <Divider />
            {role === 'student' && (
              <MenuItem component={Link} href="/student/profile/">
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
            )}
            {(role === 'admin' || role === 'superadmin') && (
              <MenuItem component={Link} href="/admin/settings/">
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={() => router.post('/logout/')}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={handleDrawerOpen}
          onClose={handleDrawerClose}
          disableBackdropTransition={!iOS}
          disableDiscovery={iOS}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: `${APPBAR_HEIGHT}px`,
          bgcolor: 'grey.50',
          minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
