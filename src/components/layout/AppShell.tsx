import * as React from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Bot,
  Bug,
  ChevronDown,
  Headphones,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Mic,
  PenLine,
  Phone,
  Settings,
  Shield,
  ThumbsUp,
  GraduationCap,
  FlaskConical,
  BookMarked,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/providers/AuthContext";
import { cn } from "@/lib/utils";

// ── LC Practice mega-menu structure ────────────────────────────────────────
const LC_SECTIONS = [
  {
    label: "Speaking",
    color: "text-blue-600",
    icon: Mic,
    parts: [
      { label: "Part 1", to: "/practice/speaking?part=1" },
      { label: "Part 2", to: "/practice/speaking?part=2" },
      { label: "Part 3", to: "/practice/speaking?part=3" },
      { label: "Part 4", to: "/practice/speaking?part=4" },
    ],
  },
  {
    label: "Writing",
    color: "text-amber-600",
    icon: PenLine,
    parts: [
      { label: "Part 1", to: "/practice/writing?part=1" },
      { label: "Part 2", to: "/practice/writing?part=2" },
    ],
  },
  {
    label: "Reading",
    color: "text-teal-600",
    icon: BookOpen,
    parts: [
      { label: "Part 1a", to: "/practice/reading?part=1a" },
      { label: "Part 1b", to: "/practice/reading?part=1b" },
      { label: "Part 2", to: "/practice/reading?part=2" },
      { label: "Part 3", to: "/practice/reading?part=3" },
      { label: "Part 4", to: "/practice/reading?part=4" },
    ],
  },
  {
    label: "Listening",
    color: "text-pink-600",
    icon: Headphones,
    parts: [
      { label: "Part 1", to: "/practice/listening?part=1" },
      { label: "Part 2", to: "/practice/listening?part=2" },
      { label: "Part 3", to: "/practice/listening?part=3" },
      { label: "Part 4", to: "/practice/listening?part=4" },
    ],
  },
];

type NavItem = {
  to?: string;
  label: string;
  icon: React.ElementType;
  children?: { to: string; label: string; icon?: React.ElementType }[];
};

const mainNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  {
    label: "AI Tutor",
    icon: Bot,
    children: [
      { to: "/practice/dialogues", label: "Dialogues", icon: Mic },
      { to: "/practice/rapid-reviews", label: "Rapid Reviews", icon: FlaskConical },
    ],
  },
  { to: "/subscription", label: "Study Plan", icon: GraduationCap },
  {
    label: "Mock Tests",
    icon: FlaskConical,
    children: [
      { to: "/attempts", label: "My Attempts", icon: BookOpen },
      { to: "/analytics", label: "Analytics", icon: LayoutDashboard },
    ],
  },
  {
    label: "Vocab",
    icon: BookMarked,
    children: [
      { to: "/practice/dialogues", label: "Word Lists", icon: BookOpen },
    ],
  },
];

const bottomNav: NavItem[] = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/attempts", label: "Help (Q&A)", icon: HelpCircle },
  { to: "/subscription", label: "Contact Us", icon: Phone },
  { to: "/subscription", label: "Tutor Feedback", icon: ThumbsUp },
  { to: "/subscription", label: "Listening Hub", icon: Headphones },
  { to: "/subscription", label: "Report a Bug", icon: Bug },
  { to: "/subscription", label: "Terms & Conditions", icon: Shield },
];

function NavGroup({ item, defaultOpen }: { item: NavItem; defaultOpen?: boolean }) {
  const location = useLocation();
  const isChildActive = item.children?.some((c) => location.pathname === c.to);
  const [open, setOpen] = React.useState(defaultOpen || isChildActive || false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isChildActive
            ? "bg-white/10 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-0.5 ml-3 space-y-0.5 border-l border-white/10 pl-4">
          {item.children?.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
                )
              }
            >
              {child.icon && <child.icon className="size-3.5 shrink-0" aria-hidden />}
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
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
    <div className="flex h-full flex-col" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}>
      {/* User Profile */}
      <div className="flex flex-col items-center gap-2 border-b border-white/10 px-5 py-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xl font-bold text-white shadow-lg">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{displayName.toUpperCase()}</p>
          <p className="text-xs text-white/50">{user?.email ?? ""}</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main navigation">
        {mainNav.map((item) =>
          item.children ? (
            <NavGroup key={item.label} item={item} />
          ) : (
            <NavLink
              key={item.to}
              to={item.to!}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          ),
        )}

        {profile?.role === "admin" && (
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "mt-2 flex items-center gap-3 rounded-lg border border-dashed border-white/20 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300" : "text-white/50 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <Shield className="size-4" aria-hidden />
            Admin Panel
          </NavLink>
        )}

        {/* Divider */}
        <div className="my-2 border-t border-white/10" />

        {/* Bottom Nav Items */}
        {bottomNav.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to!}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
              )
            }
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => { signOut(); navigate("/login"); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
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
  const [lcDropdownOpen, setLcDropdownOpen] = React.useState(false);
  const lcDropdownRef = React.useRef<HTMLDivElement>(null);
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "U").toUpperCase();
  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "User";

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (lcDropdownRef.current && !lcDropdownRef.current.contains(e.target as Node)) {
        setLcDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 md:block">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-56">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white/95 px-4 shadow-sm backdrop-blur dark:bg-card/95 md:px-6">
          {/* Mobile: hamburger */}
          <button
            type="button"
            className="mr-3 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-teal-500">
              <BookOpen className="size-4 text-white" />
            </div>
            <span className="font-bold tracking-wide text-gray-800 dark:text-white">
              PREP<span className="text-teal-500">SMART</span> <span className="rounded bg-teal-500 px-1.5 py-0.5 text-[11px] font-extrabold text-white">LC</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-teal-50 text-teal-600" : "text-gray-600 hover:bg-gray-100")
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/subscription"
              className={({ isActive }) =>
                cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-teal-50 text-teal-600" : "text-gray-600 hover:bg-gray-100")
              }
            >
              Study Plan
            </NavLink>

            {/* LC Practice mega-dropdown */}
            <div ref={lcDropdownRef} className="relative">
              <button
                onClick={() => setLcDropdownOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  lcDropdownOpen ? "bg-teal-50 text-teal-600" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                LC Practice <ChevronDown className={cn("size-3.5 transition-transform", lcDropdownOpen && "rotate-180")} />
              </button>

              {lcDropdownOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-[680px] -translate-x-1/2 rounded-2xl border bg-white shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-teal-600 to-cyan-500 px-6 py-3">
                    <span className="flex items-center gap-2 text-sm font-bold text-white">
                      ✨ LanguageCert SELT Practice
                    </span>
                    <button onClick={() => setLcDropdownOpen(false)} className="text-white/70 hover:text-white">
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Sections grid */}
                  <div className="grid grid-cols-4 gap-0 divide-x p-2">
                    {LC_SECTIONS.map((section) => (
                      <div key={section.label} className="px-4 py-3">
                        <div className={cn("mb-2 flex items-center gap-1.5 text-sm font-bold", section.color)}>
                          <section.icon className="size-4" />
                          {section.label}
                        </div>
                        <div className="space-y-1">
                          {section.parts.map((part) => (
                            <Link
                              key={part.to}
                              to={part.to}
                              onClick={() => setLcDropdownOpen(false)}
                              className="block rounded-md px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              {part.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Pro Badge */}
            <span className="hidden items-center gap-1 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 px-3 py-1 text-xs font-bold text-white shadow sm:flex">
              ⚡ Pro
            </span>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative flex size-8 items-center justify-center rounded-full border bg-white text-gray-500 shadow-sm hover:bg-gray-50 dark:bg-card"
            >
              <Bell className="size-4" />
              <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                0
              </span>
            </button>

            {/* User Avatar + Name */}
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden text-sm font-semibold text-gray-700 dark:text-white sm:block">
                {displayName.toUpperCase()}
              </span>
            </div>

            {/* PTE A Badge */}
            <span className="hidden rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white sm:block">
              PTE A
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100dvh-3.5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
