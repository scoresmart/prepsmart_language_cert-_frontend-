import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthContext";

export function AdminRoute() {
  const { user, profile, loading, profileLoading } = useAuth();

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile || profile.role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
