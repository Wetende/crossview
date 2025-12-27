/**
 * Unified Dashboard Layout
 * Shows different navigation menus based on user role
 * Roles: student, instructor, admin, superadmin
 */

import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
  Box,
  Drawer,
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
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';

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
import BusinessIcon from '@mui/icons-material/Business';
import HistoryIcon from '@mui/icons-material/History';

const DRAWER_WIDTH = 260;

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
        { label: 'Practicum Review', href: '/instructor/practicum/', icon: RateReviewIcon },
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
        { label: 'Blueprints', href: '/admin/blueprints/', icon: ArchitectureIcon },
        { label: 'Programs', href: '/admin/programs/', icon: SchoolIcon },
        { label: 'Curriculum', href: '/admin/curriculum/', icon: AccountTreeIcon },
        { label: 'Rubrics', href: '/admin/rubrics/', icon: GradingIcon },
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
        { label: 'Branding', href: '/admin/settings/branding/', icon: SettingsIcon },
        { label: 'General', href: '/admin/settings/', icon: SettingsIcon },
      ],
    },
  ],
  superadmin: [
    {
      items: [
        { label: 'Dashboard', href: '/superadmin/', icon: DashboardIcon },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Platform Settings', href: '/superadmin/platform/', icon: SettingsIcon },
        { label: 'Blueprints', href: '/superadmin/presets/', icon: ArchitectureIcon },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Logs', href: '/superadmin/logs/', icon: HistoryIcon },
      ],
    },
  ],
};

const roleLabels = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Administrator',
  superadmin: 'Super Admin',
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
  const { auth, tenant } = usePage().props;

  // Get role from props or auth
  const role = propRole || auth?.user?.role || 'student';
  const navigation = roleNavigation[role] || roleNavigation.student;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          {tenant?.name || 'Crossview LMS'}
        </Typography>
        <Chip
          label={roleLabels[role]}
          size="small"
          color={roleColors[role]}
          sx={{ mt: 0.5 }}
        />
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {navigation.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            {section.title && (
              <Typography
                variant="overline"
                sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}
              >
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href ||
                  (item.href !== '/dashboard/' && currentPath.startsWith(item.href));

                return (
                  <ListItem key={item.href} disablePadding>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={isActive}
                      sx={{
                        mx: 1,
                        borderRadius: 1,
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
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: `${roleColors[role]}.main` }}>
            {auth?.user?.firstName?.[0] || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight="medium">
              {auth?.user?.fullName || auth?.user?.email || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {roleLabels[role]}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Breadcrumbs */}
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ flex: 1 }}
          >
            <Link href="/dashboard/" style={{ textDecoration: 'none' }}>
              <Typography color="text.secondary" variant="body2">
                Dashboard
              </Typography>
            </Link>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return crumb.href && !isLast ? (
                <Link
                  key={index}
                  href={crumb.href}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography color="text.secondary" variant="body2">
                    {crumb.label}
                  </Typography>
                </Link>
              ) : (
                <Typography key={index} color="text.primary" variant="body2">
                  {crumb.label}
                </Typography>
              );
            })}
          </Breadcrumbs>

          {/* User Menu */}
          <IconButton onClick={handleMenuOpen}>
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
              <Typography variant="body2" color="text.secondary">
                {auth?.user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            {role === 'student' && (
              <MenuItem component={Link} href="/student/profile/">
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
            )}
            {(role === 'admin' || role === 'superadmin') && (
              <MenuItem component={Link} href="/admin/settings/">
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={() => router.post('/logout/')}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: 'grey.50',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
        >
          {children}
        </motion.div>
      </Box>
    </Box>
  );
}
