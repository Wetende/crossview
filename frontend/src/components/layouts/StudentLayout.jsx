/**
 * Student Layout - Wrapper around DashboardLayout with student role
 */

import DashboardLayout from './DashboardLayout';

export default function StudentLayout({ children, breadcrumbs = [] }) {
  return (
    <DashboardLayout role="student" breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}
