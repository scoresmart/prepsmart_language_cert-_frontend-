import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Mic, BookOpen, PenLine, Headphones, FileText,
  ClipboardList, BarChart2, Users, Layers, Lock, Megaphone, BookMarked,
  CreditCard, Tag, Link2, Brain, MessageSquareText, History, PieChart,
  Upload, LogOut, ChevronRight, FlaskConical, Bot, User,
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
  { to: "/admin/mock-tests", label: "Mock Tests", icon: FileText },
  { to: "/admin/sectional-tests", label: "Sectional Tests", icon: ClipboardList },
  { to: "/admin/analysis-requests", label: "Analysis Requests", icon: BarChart2 },
  { to: "/admin/user-mock-tests", label: "User Mock Tests", icon: FlaskConical },
  { to: "/admin/practice-logs", label: "Practice Logs", icon: History },
  { to: "/admin/ai-conversations", label: "AI Conversations", icon: MessageSquareText },
  { to: "/admin/ai-tutor-analytics", label: "AI Tutor Analytics", icon: PieChart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/resources", label: "Resources", icon: Layers },
  { to: "/admin/section-locks", label: "Section Locks", icon: Lock },
  { to: "/admin/promotional-popups", label: "Promotional Popups", icon: Megaphone },
  { to: "/admin/vocabulary", label: "Vocabulary", icon: BookMarked },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
  { to: "/admin/payment-links", label: "Payment Links", icon: Link2 },
];

const aiTutorItems: NavItem[] = [
  { to: "/admin/ai-tutor-credits", label: "AI Tutor Credits", icon: Brain },
  { to: "/admin/curated-qa", label: "Curated Q&A", icon: MessageSquareText },
  { to: "/admin/question-logs", label: "Question Logs", icon: History },
  { to: "/admin/qa-analytics", label: "Q&A Analytics", icon: PieChart },
  { to: "/admin/bulk-import", label: "Bulk Import", icon: Upload },
];

const navSections: NavSection[] = [
  { title: "Management", items: managementItems },
  { title: "AI Tutor Q&A", items: aiTutorItems },
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Bot className="size-4 text-white" />
          </div>
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
          <Bot className="size-5 text-primary" />
          <span className="text-sm font-semibold text-white">Admin Panel</span>
        </div>
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
