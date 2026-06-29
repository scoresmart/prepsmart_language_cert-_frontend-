import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthContext";
import { isAdminUser } from "@/lib/adminAccess";

export function AdminRoute() {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Only block on first profile fetch — not on background token refresh.
  if (profileLoading && !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!isAdminUser(user, profile)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
