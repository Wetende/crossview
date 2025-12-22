/**
 * Super Admin Layout - Wrapper around DashboardLayout with superadmin role
 */

import DashboardLayout from './DashboardLayout';

export default function SuperAdminLayout({ children, breadcrumbs = [] }) {
  return (
    <DashboardLayout role="superadmin" breadcrumbs={breadcrumbs}>
      {children}
    </DashboardLayout>
  );
}
