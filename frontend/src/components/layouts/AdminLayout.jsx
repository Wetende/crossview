/**
 * Admin Layout - Wrapper around DashboardLayout with admin role
 */

import DashboardLayout from './DashboardLayout';

export default function AdminLayout({ children, breadcrumbs = [] }) {
  return (
    <DashboardLayout role="admin" breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}
