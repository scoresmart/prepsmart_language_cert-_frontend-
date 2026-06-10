import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthContext";

const ADMIN_EMAILS = ["contact@scoresmartpte.com"];

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

  // Allow hardcoded admin email or profile role
  const isAdmin =
    ADMIN_EMAILS.includes((user.email ?? "").toLowerCase()) ||
    profile?.role === "admin";

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
