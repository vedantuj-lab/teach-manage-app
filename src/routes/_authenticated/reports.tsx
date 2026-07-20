import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: students = [] } = useQuery({
    queryKey: ["r-students", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("students").select("id,student_name,monthly_fees")).data ?? [],
  });

  const { data: fees = [] } = useQuery({
    queryKey: ["r-fees", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("fees_payments").select("*").order("payment_date")).data ?? [],
  });

  const { data: att = [] } = useQuery({
    queryKey: ["r-att", user?.id, month], enabled: !!user,
    queryFn: async () => (await supabase.from("attendance").select("*").gte("attendance_date", `${month}-01`).lte("attendance_date", `${month}-31`)).data ?? [],
  });

  const totalCollection = fees.reduce((s, f) => s + Number(f.total_amount), 0);
  const monthlyExpected = students.reduce((s, st) => s + Number(st.monthly_fees ?? 0), 0);

  const monthlyChart = useMemo(() => {
    const map: Record<string, number> = {};
    fees.forEach((f) => {
      const m = String(f.payment_date).slice(0, 7);
      map[m] = (map[m] ?? 0) + Number(f.total_amount);
    });
    return Object.entries(map).sort().slice(-6).map(([m, v]) => ({ month: m.slice(2), amount: v }));
  }, [fees]);

  const perStudentPaid = useMemo(() => {
    const m: Record<string, number> = {};
    fees.forEach((f) => { m[f.student_id] = (m[f.student_id] ?? 0) + Number(f.total_amount); });
    return m;
  }, [fees]);

  const attStats = useMemo(() => {
    const p = att.filter((a) => a.status === "Present").length;
    const ab = att.filter((a) => a.status === "Absent").length;
    const l = att.filter((a) => a.status === "Late").length;
    const lv = att.filter((a) => a.status === "Leave").length;
    const total = att.length || 1;
    return { p, ab, l, lv, pct: Math.round((p / total) * 100) };
  }, [att]);

  const exportCsv = (rows: (string | number)[][], name: string) => {
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Fees & attendance overview" />
      <div className="p-4">
        <Tabs defaultValue="fees">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 shadow-card">
                <div className="text-xs text-muted-foreground">Total Collection</div>
                <div className="text-xl font-bold text-emerald-600">₹{totalCollection.toLocaleString()}</div>
              </Card>
              <Card className="p-3 shadow-card">
                <div className="text-xs text-muted-foreground">Expected / month</div>
                <div className="text-xl font-bold text-primary">₹{monthlyExpected.toLocaleString()}</div>
              </Card>
            </div>

            <Card className="p-3 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Monthly collection</span>
              </div>
              <div className="h-48">
                {monthlyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
              </div>
            </Card>

            <Card className="p-3 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Per student</span>
                <Button size="sm" variant="outline" onClick={() => exportCsv([
                  ["Student", "Monthly Fees", "Paid", "Pending"],
                  ...students.map((s) => [s.student_name, s.monthly_fees ?? 0, perStudentPaid[s.id] ?? 0, Math.max(0, Number(s.monthly_fees ?? 0) - (perStudentPaid[s.id] ?? 0))]),
                ], "fees-report.csv")}><Download className="w-4 h-4 mr-1" />Export</Button>
              </div>
              <div className="divide-y">
                {students.map((s) => {
                  const paid = perStudentPaid[s.id] ?? 0;
                  const pending = Math.max(0, Number(s.monthly_fees ?? 0) - paid);
                  return (
                    <div key={s.id} className="py-2 flex items-center justify-between text-sm">
                      <span className="truncate">{s.student_name}</span>
                      <span className="text-right">
                        <span className="text-emerald-600 font-medium">₹{paid}</span>
                        {pending > 0 && <span className="text-destructive text-xs ml-2">₹{pending} due</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 shadow-card">
                <div className="text-xs text-muted-foreground">Attendance %</div>
                <div className="text-xl font-bold text-primary">{attStats.pct}%</div>
              </Card>
              <Card className="p-3 shadow-card">
                <div className="text-xs text-muted-foreground">Records</div>
                <div className="text-xl font-bold">{att.length}</div>
              </Card>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="Present" value={attStats.p} color="text-emerald-600" />
              <MiniStat label="Absent" value={attStats.ab} color="text-red-600" />
              <MiniStat label="Late" value={attStats.l} color="text-amber-600" />
              <MiniStat label="Leave" value={attStats.lv} color="text-slate-600" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => exportCsv([
              ["Date", "Student", "Status", "Remarks"],
              ...att.map((a) => [a.attendance_date, students.find((s) => s.id === a.student_id)?.student_name ?? "-", a.status, a.remarks ?? ""]),
            ], `attendance-${month}.csv`)}><Download className="w-4 h-4 mr-1" />Export attendance</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-2 text-center shadow-card">
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </Card>
  );
}
