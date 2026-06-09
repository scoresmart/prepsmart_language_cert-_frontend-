import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/components/layout/AdminShell";
import { AppShell } from "@/components/layout/AppShell";
import { AdminRoute } from "@/components/routing/AdminRoute";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AdminAnalyticsPage } from "@/pages/admin/AdminAnalyticsPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminQuestionsPage } from "@/pages/admin/AdminQuestionsPage";
import { AdminSubscriptionsPage } from "@/pages/admin/AdminSubscriptionsPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { AttemptsPage } from "@/pages/AttemptsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PracticeDialoguesPage } from "@/pages/PracticeDialoguesPage";
import { PracticeRapidPage } from "@/pages/PracticeRapidPage";
import { SignupPage } from "@/pages/SignupPage";
import { SubscriptionPage } from "@/pages/SubscriptionPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useAuth } from "@/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/30">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/practice/dialogues" element={<PracticeDialoguesPage />} />
            <Route path="/practice/rapid-reviews" element={<PracticeRapidPage />} />
            <Route path="/attempts" element={<AttemptsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<AdminShell />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/questions" element={<AdminQuestionsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
