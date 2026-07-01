import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Mic, BookOpen, PenLine, Headphones, FileText,
  Users, Megaphone, CreditCard, Tag, History, BookOpenCheck,
  Upload, LogOut, ChevronRight, FlaskConical, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthContext";

type NavItem = { to: string; label: string; icon: React.ElementType };
type NavSection = { title: string; items: NavItem[] };

const managementItems: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/speaking", label: "Speaking", icon: Mic },
  { to: "/admin/reading", label: "Reading", icon: BookOpen },
  { to: "/admin/writing", label: "Writing", icon: PenLine },
  { to: "/admin/listening", label: "Listening", icon: Headphones },
  { to: "/admin/questions", label: "Practice Questions", icon: BookOpenCheck },
  { to: "/admin/mock-tests", label: "Mock Tests", icon: FileText },
  { to: "/admin/user-mock-tests", label: "User Mock Tests", icon: FlaskConical },
  { to: "/admin/practice-logs", label: "Practice Logs", icon: History },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/promotional-popups", label: "Promotional Popups", icon: Megaphone },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
  { to: "/admin/bulk-import", label: "Bulk Import", icon: Upload },
];

const navSections: NavSection[] = [
  { title: "Management", items: managementItems },
];

function SidebarNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/admin/dashboard"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150",
          isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export function AdminShell() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="hidden w-[200px] shrink-0 flex-col bg-[#1a1a2e] md:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <img src="/logo.png" alt="PrepSmart LC" className="h-8 w-8 object-contain" />
          <div>
            <p className="text-[13px] font-semibold text-white">Admin Panel</p>
            <p className="text-[11px] text-slate-400">Score Smart</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3 space-y-1">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <User className="size-4 shrink-0" />
            <span className="truncate">{profile?.full_name ?? "User Portal"}</span>
            <ChevronRight className="size-3 ml-auto shrink-0" />
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all"
          >
            <LogOut className="size-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-3 border-b bg-[#1a1a2e] px-4 py-3 md:hidden">
          <img src="/logo.png" alt="PrepSmart LC" className="h-8 w-8 object-contain" />
          <span className="text-sm font-semibold text-white">Admin Panel</span>
        </div>
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
