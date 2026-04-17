import { BookOpen } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../providers/AuthProvider';

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-900">Conectando ao sistema</h1>
        <p className="mt-2 text-sm text-gray-500">
          Estamos validando sua sessao para carregar o ambiente escolar.
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PlatformRoute() {
  const { isAccessLoading, isLoading, isPlatformStaff, session } = useAuth();

  if (isLoading || isAccessLoading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isPlatformStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function SchoolRoute() {
  const { isAccessLoading, isLoading, isPlatformStaff, schoolMemberships, session } = useAuth();

  if (isLoading || isAccessLoading) {
    return <AuthLoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (isPlatformStaff) {
    return <Navigate to="/plataforma" replace />;
  }

  const hasActiveSchoolAccess = schoolMemberships.some((membership) => membership.status === 'active');

  if (!hasActiveSchoolAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
