/** PostgREST / Postgres errors we can recover from (empty data, dashboard still loads). */
export function isRecoverableDbError(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? error ?? "");
  const code = (error as { code?: string })?.code ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("schema cache") ||
    msg.includes("does not exist") ||
    msg.includes("schema must be one of")
  );
}
