# React & MUI Frontend Standards

> These standards ensure consistent, performant, and accessible UI across the Crossview LMS frontend.

## React 19 Standards

### Component Structure
- Use functional components with hooks (no class components)
- One component per file, named same as file
- Keep components under 200 lines - split if larger
- Use custom hooks to extract reusable logic

```jsx
// ✅ Good - Clean functional component
export default function StudentCard({ student, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card onClick={() => onSelect(student)}>
      {/* ... */}
    </Card>
  );
}

// ❌ Bad - Class component
class StudentCard extends Component { ... }
```

### Hooks Best Practices
- Follow Rules of Hooks (top level, React functions only)
- Use `useMemo` for expensive computations
- Use `useCallback` for functions passed to child components
- Create custom hooks for reusable stateful logic

```jsx
// ✅ Good - Memoized expensive computation
const filteredStudents = useMemo(() => 
  students.filter(s => s.name.includes(search)),
  [students, search]
);

// ✅ Good - Stable callback reference
const handleSelect = useCallback((id) => {
  setSelected(id);
}, []);
```

### State Management
- **Inertia props are the primary data source** - no need for TanStack Query for page data
- Use `usePage()` hook to access shared props (auth, tenant)
- Use local state for component-specific UI state (modals, form inputs)
- Use TanStack Query ONLY for real-time polling (rare)

```jsx
// ✅ Good - Data from Inertia props
export default function Dashboard({ enrollments, recentActivity }) {
  // Data comes directly from Django view as props
  return <EnrollmentList enrollments={enrollments} />;
}

// ✅ Good - Shared props via usePage
import { usePage } from '@inertiajs/react';

function Header() {
  const { auth } = usePage().props;
  return <Typography>{auth.user.name}</Typography>;
}

// ❌ Bad - Fetching data that should come from props
const { data } = useQuery(['enrollments'], fetchEnrollments);
```

### Props
- Use PropTypes or TypeScript for prop validation
- Destructure props in function signature
- Provide default values for optional props

```jsx
import PropTypes from 'prop-types';

function Button({ variant = 'contained', size = 'medium', children, onClick }) {
  return (
    <MuiButton variant={variant} size={size} onClick={onClick}>
      {children}
    </MuiButton>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};
```

## Inertia.js Standards

> **Golden Rule**: If it happens in the Browser, use Inertia first. Only use REST API for file uploads or real-time features.

### Navigation
- Use `<Link>` component for all navigation (not `<a>` or React Router)
- Use `router.visit()` for programmatic navigation
- Never use `window.location` or React Router

```jsx
import { Link, router } from '@inertiajs/react';

// ✅ Good - Inertia Link
<Link href="/student/programs/">View Programs</Link>

// ✅ Good - Programmatic navigation
const handleClick = () => router.visit('/student/dashboard/');

// ❌ Bad - Raw anchor or React Router
<a href="/programs">Programs</a>
<RouterLink to="/programs">Programs</RouterLink>
```

### Forms
- Use `useForm` hook for all form handling
- Submit with `post()`, `put()`, `delete()` methods
- Errors come back as props automatically

```jsx
import { useForm } from '@inertiajs/react';

function LoginForm() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/login/');  // Errors returned as props
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        value={data.email}
        onChange={e => setData('email', e.target.value)}
        error={!!errors.email}
        helperText={errors.email}
      />
      <Button type="submit" disabled={processing}>
        {processing ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

### Partial Reloads (Pagination/Filtering)
- Use `router.visit()` with `only` option for pagination
- Preserves scroll position and component state
- Much more efficient than full page reload

```jsx
// ✅ Good - Partial reload for pagination
const loadPage = (page) => {
  router.visit(`/student/assessments/?page=${page}`, {
    only: ['results', 'pagination'],  // Only fetch these props
    preserveState: true,
    preserveScroll: true,
  });
};

// ✅ Good - Partial reload for filtering
const handleFilter = (status) => {
  router.visit(`/student/programs/?status=${status}`, {
    only: ['enrollments'],
    preserveState: true,
  });
};
```

### Actions (Mark Complete, Delete, etc.)
- Use `router.post()` for actions that modify data
- Use `preserveScroll: true` to maintain scroll position

```jsx
// ✅ Good - Action with Inertia
const handleMarkComplete = () => {
  router.post(`/student/session/${nodeId}/complete/`, {}, {
    preserveScroll: true,
  });
};

// ✅ Good - Delete with confirmation
const handleDelete = () => {
  if (confirm('Are you sure?')) {
    router.delete(`/admin/programs/${id}/`);
  }
};
```

### Page Head
- Use `<Head>` component for page titles
- Set title on every page

```jsx
import { Head } from '@inertiajs/react';

export default function Dashboard({ enrollments }) {
  return (
    <>
      <Head title="Dashboard" />
      <Stack spacing={3}>
        {/* content */}
      </Stack>
    </>
  );
}
```

### Shared Props
- Access via `usePage().props`
- Available on every page (auth, tenant, flash messages)

```jsx
import { usePage } from '@inertiajs/react';

function Sidebar() {
  const { auth, tenant } = usePage().props;
  
  return (
    <Box>
      <Typography>{tenant?.institutionName}</Typography>
      <Typography>{auth?.user?.name}</Typography>
    </Box>
  );
}
```

### When to Use REST API (Exceptions)
Only use REST API with axios for:
1. **File uploads** - Practicum submissions (multipart/form-data)
2. **File downloads** - Signed URLs for certificates/submissions
3. **Real-time polling** - Dashboard stats (rare)

```jsx
// ⚠️ REST API only for file uploads
import axios from 'axios';

// Configure CSRF for REST calls from browser
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  await axios.post('/api/v1/practicum/upload/', formData);
  router.reload({ only: ['submission'] });  // Refresh Inertia props
};
```

## MUI v7 Standards

### Theme Usage
- NEVER hardcode colors - always use theme
- Use `sx` prop for one-off styles
- Use theme overrides for global component styles
- Access theme via `useTheme()` hook when needed

```jsx
// ✅ Good - Theme colors
<Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>

// ✅ Good - Theme spacing
<Stack sx={{ gap: 2, p: 3 }}>  // 16px gap, 24px padding

// ❌ Bad - Hardcoded values
<Box sx={{ backgroundColor: '#2563EB', padding: '24px' }}>
```

### Component Patterns
- Use MUI components, not raw HTML elements
- Prefer `Stack` over manual flexbox
- Use `Grid` for responsive layouts
- Use `Container` for max-width content

```jsx
// ✅ Good - MUI components
<Stack direction="row" spacing={2} alignItems="center">
  <Avatar />
  <Typography variant="h6">{name}</Typography>
</Stack>

// ❌ Bad - Raw HTML with inline styles
<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
```

### Typography
- Always use Typography component for text
- Use semantic variants (h1-h6, body1, body2, caption)
- Never use raw `<p>`, `<h1>`, `<span>` for text

```jsx
// ✅ Good
<Typography variant="h4" component="h1">Page Title</Typography>
<Typography variant="body1" color="text.secondary">Description</Typography>

// ❌ Bad
<h1 style={{ fontSize: '24px' }}>Page Title</h1>
```

### Responsive Design
- Use MUI breakpoints, not media queries
- Test all components on mobile (xs), tablet (sm), desktop (md+)
- Use responsive values in sx prop

```jsx
// ✅ Good - Responsive padding
<Box sx={{ 
  p: { xs: 2, sm: 3, md: 4 },
  display: { xs: 'block', md: 'flex' }
}}>
```

## Framer Motion Standards

### Entrance Animations
- ALL page sections need entrance animations
- Use `whileInView` with `viewport={{ once: true }}`
- Keep animations subtle (0.3-0.6s duration)
- Use consistent easing: `[0.215, 0.61, 0.355, 1]`

```jsx
// ✅ Standard entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
>
  {children}
</motion.div>
```

### Interactive Animations
- Use `whileHover` and `whileTap` for buttons
- Keep tap scale subtle (0.95-0.98)
- Use spring physics for natural feel

```jsx
// ✅ Button animation wrapper
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
>
  <Button>Click Me</Button>
</motion.div>
```

### Performance
- Use `layout` prop sparingly (expensive)
- Prefer CSS transforms over layout properties
- Use `AnimatePresence` for exit animations

## Loading & Error States

### Loading States
- Use Skeleton components for content loading
- Show loading indicator for actions (buttons, forms)
- Never show empty containers while loading

```jsx
// ✅ Good - Skeleton loading
{isLoading ? (
  <Stack spacing={2}>
    <Skeleton variant="rectangular" height={200} />
    <Skeleton variant="text" width="60%" />
  </Stack>
) : (
  <ContentCard data={data} />
)}
```

### Error States
- Use Alert component for error messages
- Provide actionable error messages
- Include retry option where applicable

```jsx
// ✅ Good - Error with retry
{error && (
  <Alert 
    severity="error" 
    action={<Button onClick={refetch}>Retry</Button>}
  >
    Failed to load students. Please try again.
  </Alert>
)}
```

### Empty States
- Use EmptyState component with icon and message
- Provide action to resolve empty state

## Accessibility

### Required Practices
- All images need `alt` text
- All form inputs need labels (visible or aria-label)
- Interactive elements need focus states
- Color contrast must meet WCAG AA (4.5:1)
- Use semantic HTML elements

```jsx
// ✅ Good - Accessible form
<TextField
  label="Email Address"
  type="email"
  required
  helperText="We'll never share your email"
/>

// ✅ Good - Icon button with label
<IconButton aria-label="Delete student">
  <DeleteIcon />
</IconButton>
```

## File Organization

```
frontend/src/
├── components/
│   ├── common/           # Shared components (Button, Card, etc.)
│   ├── forms/            # Form components
│   ├── navigation/       # Navbar, Sidebar, Breadcrumbs
│   └── [feature]/        # Feature-specific components
├── Pages/                # Inertia page components
├── hooks/                # Custom hooks
├── contexts/             # React contexts
├── theme/                # MUI theme configuration
├── utils/                # Utility functions
└── styles/               # Global CSS
```

## Checklist for Every Component

- [ ] Uses theme colors (no hardcoded hex)
- [ ] Uses MUI Typography for all text
- [ ] Has Framer Motion entrance animation
- [ ] Responsive (tested on mobile)
- [ ] Accessible (labels, alt text, focus states)
- [ ] Has loading state (for actions)
- [ ] Has error state (displays errors from props)
- [ ] PropTypes defined

## Checklist for Every Page Component

- [ ] Has `<Head title="..." />` for page title
- [ ] Receives data as props from Django view
- [ ] Uses `<Link>` for navigation (not `<a>`)
- [ ] Forms use `useForm` hook
- [ ] Pagination uses Partial Reloads (`only: [...]`)
- [ ] No unnecessary API calls (data comes from props)
