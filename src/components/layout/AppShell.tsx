import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/practice/dialogues", label: "Dialogues", icon: MessageCircle },
  { to: "/practice/rapid-reviews", label: "Rapid reviews", icon: Zap },
  { to: "/attempts", label: "Attempts", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-muted/30 pb-20 md:pb-0">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" aria-hidden />
          </div>
          <div>
            <p className="font-display text-lg leading-tight text-foreground">LanguageCert</p>
            <p className="text-xs text-muted-foreground">PrepSmart practice</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Main">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )
              }
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </NavLink>
          ))}
          {profile?.role === "admin" ? (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                cn(
                  "mt-4 flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 text-sm font-medium",
                  isActive ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted",
                )
              }
            >
              <LayoutDashboard className="size-4" aria-hidden />
              Admin
            </NavLink>
          ) : null}
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <Link to="/dashboard" className="font-display text-lg text-primary">
            LC Practice
          </Link>
          <Button size="sm" variant="outline" onClick={() => signOut()}>
            Out
          </Button>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background/95 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
        aria-label="Mobile"
      >
        {nav.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <Icon className="size-5" aria-hidden />
            {label.split(" ")[0]}
          </NavLink>
        ))}
        <button
          type="button"
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
          onClick={() => navigate("/settings")}
        >
          <Settings className="size-5" aria-hidden />
          More
        </button>
      </nav>
    </div>
  );
}
