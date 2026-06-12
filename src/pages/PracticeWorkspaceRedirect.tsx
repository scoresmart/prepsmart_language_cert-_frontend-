import { Navigate, useParams } from "react-router-dom";
import { parseQuestionIndex } from "@/lib/practiceNavigation";
import { isPracticeModule, slugToPart, workspaceUrl } from "@/lib/practiceRoutes";

/** /practice/:module/:partSlug/question/:index → /workspace/... */
export function PracticeWorkspaceRedirect() {
  const { module = "", partSlug = "", questionIndex } = useParams<{
    module: string;
    partSlug: string;
    questionIndex: string;
  }>();
  const part = slugToPart(partSlug) ?? "";
  const index = parseQuestionIndex(questionIndex);

  if (!isPracticeModule(module) || !part) {
    return <Navigate to="/practice" replace />;
  }

  return <Navigate to={workspaceUrl(module, part, index)} replace />;
}
