import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { getDefaultPart } from "@/lib/practiceQuestions";
import { isPracticeModule, partQuestionUrl, partStartUrl } from "@/lib/practiceRoutes";
import { parseQuestionIndex } from "@/lib/practiceNavigation";

/** /practice/:module/questions?part=1 → /practice/listening/part-1/questions */
export function PracticeLegacyQuestionsRedirect() {
  const { module = "" } = useParams<{ module: string }>();
  const [searchParams] = useSearchParams();
  const part = searchParams.get("part") ?? getDefaultPart(module);

  if (!isPracticeModule(module)) {
    return <Navigate to="/practice" replace />;
  }

  return <Navigate to={partStartUrl(module, part)} replace />;
}

/** /practice/:module/question/:index?part=1 → /practice/listening/part-1/question/1 */
export function PracticeLegacyQuestionRedirect() {
  const { module = "", questionIndex } = useParams<{ module: string; questionIndex: string }>();
  const [searchParams] = useSearchParams();
  const part = searchParams.get("part") ?? getDefaultPart(module);
  const index = parseQuestionIndex(questionIndex);

  if (!isPracticeModule(module)) {
    return <Navigate to="/practice" replace />;
  }

  return <Navigate to={partQuestionUrl(module, part, index)} replace />;
}
