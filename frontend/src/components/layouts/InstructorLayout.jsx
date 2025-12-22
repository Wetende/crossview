/**
 * Instructor Layout - Wrapper around DashboardLayout with instructor role
 */

import DashboardLayout from './DashboardLayout';

export default function InstructorLayout({ children, breadcrumbs = [] }) {
  return (
    <DashboardLayout role="instructor" breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}
