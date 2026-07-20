import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import {
  Users, Wallet, CalendarCheck, MessageSquare,
  Megaphone, Phone, BarChart3, Settings, GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

const tiles = [
  { to: "/students", label: "Students", icon: Users, color: "from-blue-500 to-indigo-600" },
  { to: "/fees", label: "Fees Received", icon: Wallet, color: "from-emerald-500 to-teal-600" },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, color: "from-violet-500 to-purple-600" },
  { to: "/sms", label: "SMS", icon: MessageSquare, color: "from-sky-500 to-blue-600" },
  { to: "/notice", label: "Notice", icon: Megaphone, color: "from-amber-500 to-orange-600" },
  { to: "/call", label: "Call", icon: Phone, color: "from-green-500 to-emerald-600" },
  { to: "/reports", label: "Reports", icon: BarChart3, color: "from-rose-500 to-pink-600" },
  { to: "/profile", label: "Settings", icon: Settings, color: "from-slate-500 to-slate-700" },
] as const;

function Dashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const month = today.slice(0, 7);
      const [s, f, a] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "Active"),
        supabase.from("fees_payments").select("total_amount").gte("payment_date", `${month}-01`),
        supabase.from("attendance").select("status").eq("attendance_date", today),
      ]);
      const collected = (f.data ?? []).reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0);
      const present = (a.data ?? []).filter((r) => r.status === "Present").length;
      return { students: s.count ?? 0, collected, present, marked: a.data?.length ?? 0 };
    },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      {/* Header */}
      <div className="gradient-brand text-primary-foreground px-5 pt-8 pb-16 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            {profile?.class_logo_url ? (
              <img src={profile.class_logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover" />
            ) : (
              <GraduationCap className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-xs opacity-80">{dateStr}</div>
            <div className="font-semibold">{profile?.class_name ?? "My Tuition Class"}</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="text-sm opacity-90">{greeting},</div>
          <div className="text-2xl font-bold">{profile?.teacher_name || "Teacher"} 👋</div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="px-4 -mt-10 grid grid-cols-3 gap-3">
        <StatCard label="Students" value={stats?.students ?? 0} />
        <StatCard label="Present today" value={`${stats?.present ?? 0}/${stats?.marked ?? 0}`} />
        <StatCard label="This month" value={`₹${(stats?.collected ?? 0).toLocaleString()}`} />
      </div>

      {/* Tile grid */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.to} to={t.to as "/"} className="group">
              <Card className="p-4 h-32 flex flex-col justify-between shadow-card hover:shadow-elevated transition-all active:scale-[0.98]">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white shadow-elevated`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm">{t.label}</div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-3 shadow-card">
      <div className="text-lg font-bold leading-tight truncate">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}
