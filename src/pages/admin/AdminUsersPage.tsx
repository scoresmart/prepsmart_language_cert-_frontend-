import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Eye, EyeOff, KeyRound, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/providers/AuthContext";
import { isAdminEmail } from "@/lib/adminAccess";
import { adminUsersApi, type AdminUserRow, type AdminUserScope } from "@/lib/adminUsersApi";
import { cn } from "@/lib/utils";

const LC_SUBJECT = "Language Cert";
const MIN_PASSWORD = 6;

type CreateForm = { name: string; email: string; password: string; phone: string; grantAccess: boolean; expiry: string };
const emptyCreateForm: CreateForm = { name: "", email: "", password: "", phone: "", grantAccess: true, expiry: "" };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return "—";
  }
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy, h:mm a");
  } catch {
    return "—";
  }
}

function isProtectedAdmin(u: AdminUserRow) {
  return u.role === "admin" || isAdminEmail(u.email);
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        autoFocus={autoFocus}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function AdminUsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();

  const [scope, setScope] = React.useState<AdminUserScope>("lc");
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebounced(searchInput.trim(), 300);
  const [page, setPage] = React.useState(0);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [createForm, setCreateForm] = React.useState<CreateForm>(emptyCreateForm);
  const [pwTarget, setPwTarget] = React.useState<AdminUserRow | null>(null);
  const [pw, setPw] = React.useState({ next: "", confirm: "" });
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUserRow | null>(null);

  React.useEffect(() => setPage(0), [scope, search]);

  const listKey = ["lc", "admin", "users", scope, search, page] as const;
  const q = useQuery({
    queryKey: listKey,
    queryFn: () => adminUsersApi.list({ scope, search, page }),
    placeholderData: keepPreviousData,
    // Picks up password changes users make from their own Settings page.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["lc", "admin", "users"] });

  const createMutation = useMutation({
    mutationFn: () =>
      adminUsersApi.create({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone.trim() || undefined,
        grantAccess: createForm.grantAccess,
        expiry: createForm.grantAccess && createForm.expiry ? new Date(`${createForm.expiry}T23:59:59`).toISOString() : null,
      }),
    onSuccess: (res) => {
      toast.success(`User ${res.user.email} created`);
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminUsersApi.setPassword(id, password),
    onSuccess: () => {
      toast.success(`Password updated for ${pwTarget?.email ?? "user"}. They've been signed out on all devices.`);
      setPwTarget(null);
      setPw({ next: "", confirm: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accessMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => adminUsersApi.setAccess(id, enabled),
    onSuccess: (_d, v) => {
      toast.success(v.enabled ? "Language Cert access granted" : "Language Cert access paused");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminUsersApi.remove(id),
    onSuccess: () => {
      toast.success(`Deleted ${deleteTarget?.email ?? "user"}`);
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = q.data?.users ?? [];
  const total = q.data?.total ?? 0;
  const pageSize = q.data?.pageSize ?? 50;
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  const createValid =
    createForm.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim()) && createForm.password.length >= MIN_PASSWORD;
  const pwError =
    pw.next && pw.next.length < MIN_PASSWORD
      ? `At least ${MIN_PASSWORD} characters`
      : pw.confirm && pw.next !== pw.confirm
        ? "Passwords do not match"
        : null;
  const pwValid = pw.next.length >= MIN_PASSWORD && pw.next === pw.confirm;
  const deleteOtherCourses = deleteTarget?.courses.filter((c) => c !== LC_SUBJECT) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <Users className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Users</h1>
            <p className="text-sm text-slate-500">
              {q.isLoading ? "Loading…" : `${total} ${scope === "lc" ? "Language Cert" : "total"} user${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setCreateForm(emptyCreateForm);
            setCreateOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="size-4" />
          Add user
        </Button>
      </div>

      <Card className="border-0 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
            {(
              [
                ["lc", "Language Cert"],
                ["all", "All users"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  scope === value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email or phone"
              className="pl-9"
            />
          </div>
        </div>

        <CardContent className="p-0">
          {q.isError ? (
            <div className="p-8 text-center text-sm text-red-600">{(q.error as Error).message}</div>
          ) : q.isLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              {search ? `No users match “${search}”.` : "No users yet."}
            </div>
          ) : (
            <div className={cn("overflow-x-auto transition-opacity", q.isFetching && "opacity-60")}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-5 py-3 font-medium text-slate-500">User</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Role</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Courses</th>
                    <th className="px-4 py-3 font-medium text-slate-500">LC access</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Password</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Joined</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const protectedAdmin = isProtectedAdmin(u);
                    const isMe = u.id === me?.id;
                    const hasAccess = u.lc_access?.status === "active";
                    const accessPending = accessMutation.isPending && accessMutation.variables?.id === u.id;
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-700">
                            {u.name || "—"}
                            {isMe && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                          </div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                          {u.phone && <div className="text-xs text-slate-400">{u.phone}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.courses.length ? (
                              u.courses.map((c) => (
                                <Badge key={c} variant="outline" className="font-normal">
                                  {c}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {protectedAdmin ? (
                            <span className="text-xs text-slate-400">Admin</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={hasAccess}
                                disabled={accessPending}
                                onCheckedChange={(enabled) => accessMutation.mutate({ id: u.id, enabled })}
                                aria-label={`Language Cert access for ${u.email}`}
                              />
                              <span className="text-xs text-slate-500">
                                {hasAccess
                                  ? u.lc_access?.course_expiry_at
                                    ? `until ${formatDate(u.lc_access.course_expiry_at)}`
                                    : "No expiry"
                                  : u.lc_access
                                    ? u.lc_access.status
                                    : "None"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.password_changed ? (
                            <div>
                              <Badge
                                variant={u.password_changed.changed_by === "user" ? "default" : "secondary"}
                                className="font-normal"
                              >
                                {u.password_changed.changed_by === "user" ? "Changed by user" : "Set by admin"}
                              </Badge>
                              <div className="mt-1 text-xs tabular-nums text-slate-400">
                                {formatDateTime(u.password_changed.changed_at)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-500">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setPw({ next: "", confirm: "" });
                                setPwTarget(u);
                              }}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Change password"
                            >
                              <KeyRound className="size-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              disabled={protectedAdmin || isMe}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
                              title={protectedAdmin ? "Admin accounts can't be deleted" : "Delete user"}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {total > pageSize && (
            <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-slate-500">
              <span className="tabular-nums">
                {from}–{to} of {total}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={to >= total} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>The account is ready immediately — no email confirmation needed.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (createValid && !createMutation.isPending) createMutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Runa Shrestha"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email (login ID) *</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="name@example.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <PasswordInput
                value={createForm.password}
                onChange={(v) => setCreateForm({ ...createForm, password: v })}
                placeholder={`At least ${MIN_PASSWORD} characters`}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={createForm.grantAccess}
                  onCheckedChange={(v) => setCreateForm({ ...createForm, grantAccess: v })}
                />
                <Label>Grant Language Cert access</Label>
              </div>
              {createForm.grantAccess && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Access expires (leave empty for no expiry)</Label>
                  <Input
                    type="date"
                    value={createForm.expiry}
                    min={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setCreateForm({ ...createForm, expiry: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!createValid || createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change password */}
      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>{pwTarget?.email}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (pwTarget && pwValid) passwordMutation.mutate({ id: pwTarget.id, password: pw.next });
            }}
          >
            <div className="space-y-1.5">
              <Label>New password</Label>
              <PasswordInput value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm password</Label>
              <PasswordInput value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} />
            </div>
            {pwError && <p className="text-xs text-red-600">{pwError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPwTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!pwValid || passwordMutation.isPending}>
                {passwordMutation.isPending ? "Saving…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete user */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name ? `${deleteTarget.name} · ` : ""}
              {deleteTarget?.email}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This permanently deletes the account, its login and its practice history. This can't be undone.
          </p>
          {deleteOtherCourses.length > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This user is also enrolled in <strong>{deleteOtherCourses.join(", ")}</strong>. Deleting removes their
              account from every ScoreSmart platform. To only remove Language Cert, turn off LC access instead.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
