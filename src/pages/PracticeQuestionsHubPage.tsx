import { Navigate, useParams } from "react-router-dom";
import { isPracticeModule, partStartUrl, slugToPart } from "@/lib/practiceRoutes";

/** Legacy hub URL — redirects into the dedicated practice workspace (question 1). */
export function PracticeQuestionsHubPage() {
  const { module = "", partSlug = "" } = useParams<{ module: string; partSlug: string }>();
  const part = slugToPart(partSlug) ?? "";

  if (!isPracticeModule(module) || !part) {
    return <Navigate to="/practice" replace />;
  }

  return <Navigate to={partStartUrl(module, part)} replace />;
}
