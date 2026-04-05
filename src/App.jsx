import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/sonner'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'

import OwnerDashboard from '@/pages/owner/OwnerDashboard'
import PropertiesPage from '@/pages/owner/PropertiesPage'
import PropertyDetailPage from '@/pages/owner/PropertyDetailPage'
import TenantsPage from '@/pages/owner/TenantsPage'
import TenantDetailPage from '@/pages/owner/TenantDetailPage'
import MaintenancePage from '@/pages/owner/MaintenancePage'

import TenantDashboard from '@/pages/tenant/TenantDashboard'
import MyPropertyPage from '@/pages/tenant/MyPropertyPage'
import MyMaintenancePage from '@/pages/tenant/MyMaintenancePage'
import MyLeasePage from '@/pages/tenant/MyLeasePage'

function RootRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Owner routes */}
          <Route element={<ProtectedRoute requiredRole="owner" />}>
            <Route element={<AppShell />}>
              <Route path="/owner/dashboard" element={<OwnerDashboard />} />
              <Route path="/owner/properties" element={<PropertiesPage />} />
              <Route path="/owner/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/owner/tenants" element={<TenantsPage />} />
              <Route path="/owner/tenants/:id" element={<TenantDetailPage />} />
              <Route path="/owner/maintenance" element={<MaintenancePage />} />
            </Route>
          </Route>

          {/* Tenant routes */}
          <Route element={<ProtectedRoute requiredRole="tenant" />}>
            <Route element={<AppShell />}>
              <Route path="/tenant/dashboard" element={<TenantDashboard />} />
              <Route path="/tenant/property" element={<MyPropertyPage />} />
              <Route path="/tenant/maintenance" element={<MyMaintenancePage />} />
              <Route path="/tenant/lease" element={<MyLeasePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}
