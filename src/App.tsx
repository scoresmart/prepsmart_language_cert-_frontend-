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
import { AdminSpeakingPage } from "@/pages/admin/AdminSpeakingPage";
import { AdminReadingPage } from "@/pages/admin/AdminReadingPage";
import { AdminWritingPage } from "@/pages/admin/AdminWritingPage";
import { AdminListeningPage } from "@/pages/admin/AdminListeningPage";
import { AdminMockTestsPage } from "@/pages/admin/AdminMockTestsPage";
import { AdminUserMockTestsPage } from "@/pages/admin/AdminUserMockTestsPage";
import { AdminPracticeLogsPage } from "@/pages/admin/AdminPracticeLogsPage";
import { AdminPromotionalPopupsPage } from "@/pages/admin/AdminPromotionalPopupsPage";
import { AdminCouponsPage } from "@/pages/admin/AdminCouponsPage";
import { AdminBulkImportPage } from "@/pages/admin/AdminBulkImportPage";
import { MockTestCatalogPage } from "@/pages/MockTestCatalogPage";
import { MockTestPreviousResultsPage } from "@/pages/MockTestPreviousResultsPage";
import { MockTestIntroPage } from "@/pages/MockTestIntroPage";
import { MockTestWorkspacePage } from "@/pages/MockTestWorkspacePage";
import { MockTestResultsPage } from "@/pages/MockTestResultsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { AttemptsPage } from "@/pages/AttemptsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PracticeDialoguesPage } from "@/pages/PracticeDialoguesPage";
import { PracticeRapidPage } from "@/pages/PracticeRapidPage";
import {
  PracticeLegacyQuestionRedirect,
  PracticeLegacyQuestionsRedirect,
} from "@/pages/PracticeLegacyRedirect";
import { PracticeHomePage } from "@/pages/PracticeHomePage";
import { PracticeModulePage } from "@/pages/PracticeModulePage";
import { PracticeQuestionPage } from "@/pages/PracticeQuestionPage";
import { PracticeQuestionsHubPage } from "@/pages/PracticeQuestionsHubPage";
import { PracticeWorkspaceRedirect } from "@/pages/PracticeWorkspaceRedirect";
import { SignupPage } from "@/pages/SignupPage";
import { SubscriptionPage } from "@/pages/SubscriptionPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useAuth } from "@/providers/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminUser } from "@/lib/adminAccess";

function RootRedirect() {
  const { user, profile, loading, profileLoading } = useAuth();
  if (loading || (user && profileLoading && !profile)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/30">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }
  if (user) {
    return <Navigate to={isAdminUser(user, profile) ? "/admin/dashboard" : "/dashboard"} replace />;
  }
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
          <Route
            path="/workspace/:module/:partSlug/question/:questionIndex"
            element={<PracticeQuestionPage />}
          />
          <Route
            path="/practice/:module/:partSlug/question/:questionIndex"
            element={<PracticeWorkspaceRedirect />}
          />

          <Route
            path="/mock-test/:testId/step/:stepIndex"
            element={<MockTestWorkspacePage />}
          />

          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/mock-tests" element={<MockTestCatalogPage />} />
            <Route path="/mock-tests/previous-results" element={<MockTestPreviousResultsPage />} />
            <Route path="/mock-test/:testId" element={<MockTestIntroPage />} />
            <Route path="/mock-test/:testId/results" element={<MockTestResultsPage />} />
            <Route path="/practice" element={<PracticeHomePage />} />
            <Route path="/practice/dialogues" element={<PracticeDialoguesPage />} />
            <Route path="/practice/rapid-reviews" element={<PracticeRapidPage />} />
            <Route path="/practice/:module/:partSlug/questions" element={<PracticeQuestionsHubPage />} />
            <Route path="/practice/:module/questions" element={<PracticeLegacyQuestionsRedirect />} />
            <Route path="/practice/:module/question/:questionIndex" element={<PracticeLegacyQuestionRedirect />} />
            <Route path="/practice/:module" element={<PracticeModulePage />} />
            <Route path="/attempts" element={<AttemptsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<AdminShell />}>
              {/* Dashboard */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

              {/* Question Sections */}
              <Route path="/admin/speaking" element={<AdminSpeakingPage />} />
              <Route path="/admin/reading" element={<AdminReadingPage />} />
              <Route path="/admin/writing" element={<AdminWritingPage />} />
              <Route path="/admin/listening" element={<AdminListeningPage />} />

              {/* Tests */}
              <Route path="/admin/mock-tests" element={<AdminMockTestsPage />} />

              {/* Legacy questions route */}
              <Route path="/admin/questions" element={<AdminQuestionsPage />} />

              {/* Analytics & Logs */}
              <Route path="/admin/user-mock-tests" element={<AdminUserMockTestsPage />} />
              <Route path="/admin/practice-logs" element={<AdminPracticeLogsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />

              {/* Management */}
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/promotional-popups" element={<AdminPromotionalPopupsPage />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              <Route path="/admin/bulk-import" element={<AdminBulkImportPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
