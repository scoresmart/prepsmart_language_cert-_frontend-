import { MOCK_TEST_STEPS } from "@/lib/mockTestFormat";

export function mockTestCatalogUrl() {
  return "/mock-tests";
}

export function mockTestPreviousResultsUrl() {
  return "/mock-tests/previous-results";
}

export function mockTestIntroUrl(testId: string) {
  return `/mock-test/${testId}`;
}

export function mockTestStepUrl(testId: string, stepIndex: number) {
  const clamped = Math.min(Math.max(1, stepIndex), MOCK_TEST_STEPS.length);
  return `/mock-test/${testId}/step/${clamped}`;
}

export function mockTestResultsUrl(testId: string) {
  return `/mock-test/${testId}/results`;
}

export function parseMockStepIndex(param: string | undefined): number {
  const n = parseInt(param ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
