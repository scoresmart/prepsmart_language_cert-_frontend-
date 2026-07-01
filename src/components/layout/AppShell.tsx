import * as React from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  Crown,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  FlaskConical,
  BookMarked,
  Menu,
} from "lucide-react";
import { useAuth } from "@/providers/AuthContext";
import { cn } from "@/lib/utils";
import { LCPracticeDropdown } from "@/components/layout/LCPracticeDropdown";
import { isAdminUser } from "@/lib/adminAccess";

type NavItem = {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { to: string; label: string; icon?: React.ElementType }[];
};

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/subscription", label: "Pro Plans", icon: Crown },
  {
    label: "Mock Tests",
    icon: FlaskConical,
    children: [
      { to: "/mock-tests", label: "Mock Test Catalog", icon: FlaskConical },
      { to: "/attempts", label: "My Attempts", icon: BookOpen },
      { to: "/analytics", label: "Analytics", icon: LayoutDashboard },
    ],
  },
  {
    label: "Vocab",
    icon: BookMarked,
    children: [
      { to: "/practice/reading", label: "Word Lists", icon: BookOpen },
    ],
  },
];

const bottomNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/subscription", label: "Terms & Conditions", icon: Shield },
];

function NavGroup({ item }: { item: NavItem }) {
  const location = useLocation();
  const isChildActive = item.children?.some((c) => location.pathname.startsWith(c.to.split("?")[0]));
  const [open, setOpen] = React.useState(isChildActive || false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
          isChildActive ? "bg-blue-600/25 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} aria-hidden />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          open ? "mt-1 max-h-48 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="ml-3 space-y-0.5 border-l border-white/10 pl-4">
          {item.children?.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200",
                  isActive ? "bg-blue-600 text-white" : "text-white/60 hover:translate-x-0.5 hover:bg-white/10 hover:text-white",
                )
              }
            >
              {child.icon && <child.icon className="size-3.5 shrink-0" aria-hidden />}
              {child.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "U").toUpperCase();
  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "User";

  return (
    <div className="flex h-full flex-col bg-[#1a1a2e]">
      <div className="flex flex-col items-center gap-2 border-b border-white/10 px-5 py-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white shadow-lg ring-4 ring-blue-500/20">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-white">{displayName.toUpperCase()}</p>
          <p className="text-xs text-white/45">{user?.email ?? ""}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main navigation">
        {mainNav.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to!}
              onClick={onClose}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ),
        )}

        {isAdminUser(user, profile) && (
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "mt-2 flex items-center gap-3 rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300" : "text-white/50 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <Shield className="size-4" aria-hidden />
            Admin Panel
          </NavLink>
        )}

        <div className="my-2 border-t border-white/10" />

        {bottomNav.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to!}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive ? "bg-blue-600/30 text-white" : "text-white/55 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => { signOut(); navigate("/login"); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-all hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
          Log Out
        </button>
      </div>
    </div>
  );
}

export function AppShell() {
  const { profile, user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "U").toUpperCase();
  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "User";

  const topNavClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300",
      isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-white/70 hover:bg-white/10 hover:text-white hover:scale-105",
    );

  return (
    <div className="min-h-dvh bg-[#0f0f1a] font-sans">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 md:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-fade-in-up">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="md:pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#1a1a2e]/95 px-4 backdrop-blur-md md:gap-6 md:px-6">
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <Link to="/dashboard" className="flex shrink-0 items-center gap-2 transition-transform hover:scale-105">
            <img src="/logo.png" alt="PrepSmart LC" className="size-8 object-contain" />
            <span className="hidden font-bold tracking-wide text-white sm:inline">
              PREPSMART LC
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            <NavLink to="/dashboard" className={topNavClass}>Home</NavLink>
            <LCPracticeDropdown align="center" />
          </nav>

          <div className="lg:hidden">
            <LCPracticeDropdown align="left" />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              to="/subscription"
              className="hidden items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 text-xs font-bold text-gray-900 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 sm:flex"
            >
              <Crown className="size-3" />
              Pro
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white ring-2 ring-blue-500/30">
                {initials}
              </div>
              <span className="hidden text-sm font-semibold text-white lg:block">{displayName.toUpperCase()}</span>
            </div>
            <span className="hidden rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white sm:block">LC</span>
          </div>
        </header>

        <main className="min-h-[calc(100dvh-3.5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
