import { Link, useLocation } from "@tanstack/react-router";
import { Home, Users, CalendarCheck, Wallet, User } from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/students", label: "Students", icon: Users },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/fees", label: "Fees", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur">
      <div className="max-w-2xl mx-auto grid grid-cols-5">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.4]" : ""}`} />
              <span className={active ? "font-semibold" : ""}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
