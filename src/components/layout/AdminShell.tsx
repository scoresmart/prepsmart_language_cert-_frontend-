import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, BookOpen, CreditCard, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/questions", label: "Questions", icon: BookOpen },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminShell() {
  return (
    <div className="min-h-dvh bg-muted/30 md:flex">
      <aside className="w-full border-b bg-card md:w-56 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center border-b px-4 font-display text-lg text-primary md:h-16">LC Admin</div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible" aria-label="Admin">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden p-3 md:block">
          <NavLink
            to="/dashboard"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to app
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
