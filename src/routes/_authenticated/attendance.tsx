import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CalendarCheck, Check, X, Clock, LogOut as LeaveIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({ meta: [{ title: "Attendance" }] }),
  component: AttendancePage,
});

type Att = { id?: string; student_id: string; status: string; attendance_date: string };
type Student = { id: string; student_name: string; standard: string | null; batch_name: string | null };

const statuses = [
  { value: "Present", icon: Check, color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "Absent", icon: X, color: "bg-red-100 text-red-700 border-red-300" },
  { value: "Late", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "Leave", icon: LeaveIcon, color: "bg-slate-100 text-slate-700 border-slate-300" },
] as const;

function AttendancePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: students = [] } = useQuery({
    queryKey: ["students-att", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id,student_name,standard,batch_name").eq("status", "Active").order("student_name");
      return (data ?? []) as Student[];
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["attendance", user?.id, date], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*").eq("attendance_date", date);
      return (data ?? []) as Att[];
    },
  });

  const map = new Map(records.map((r) => [r.student_id, r.status]));

  const mark = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: string }) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("attendance").upsert({
        teacher_id: user.id, student_id: studentId, attendance_date: date, status,
      } as never, { onConflict: "student_id,attendance_date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const markAllPresent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const rows = students.map((s) => ({ teacher_id: user.id, student_id: s.id, attendance_date: date, status: "Present" }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("attendance").upsert(rows as never, { onConflict: "student_id,attendance_date" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Attendance saved"); qc.invalidateQueries({ queryKey: ["attendance"] }); },
  });

  const stats = {
    present: records.filter((r) => r.status === "Present").length,
    absent: records.filter((r) => r.status === "Absent").length,
    late: records.filter((r) => r.status === "Late").length,
    leave: records.filter((r) => r.status === "Leave").length,
  };

  return (
    <div>
      <PageHeader title="Attendance" subtitle={date} action={
        <Button size="sm" variant="outline" onClick={() => markAllPresent.mutate()}>All present</Button>
      } />
      <div className="p-4 space-y-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Present" value={stats.present} color="text-emerald-600" />
          <Stat label="Absent" value={stats.absent} color="text-red-600" />
          <Stat label="Late" value={stats.late} color="text-amber-600" />
          <Stat label="Leave" value={stats.leave} color="text-slate-600" />
        </div>

        {students.length === 0 ? (
          <Card className="p-10 text-center shadow-card">
            <CalendarCheck className="w-10 h-10 mx-auto text-primary" />
            <div className="mt-3 font-semibold">No active students</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {students.map((s) => {
              const current = map.get(s.id);
              return (
                <Card key={s.id} className="p-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{s.student_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{[s.standard && `Std ${s.standard}`, s.batch_name].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {statuses.map((st) => {
                      const Icon = st.icon;
                      const active = current === st.value;
                      return (
                        <button
                          key={st.value}
                          onClick={() => mark.mutate({ studentId: s.id, status: st.value })}
                          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs border transition-all ${active ? st.color + " font-semibold" : "border-border text-muted-foreground hover:bg-muted"}`}
                        >
                          <Icon className="w-3.5 h-3.5" />{st.value}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-2 text-center shadow-card">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </Card>
  );
}
