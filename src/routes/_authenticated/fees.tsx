import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Trash2, Wallet, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => ({ meta: [{ title: "Fees" }] }),
  component: FeesPage,
});

type Fee = {
  id: string; student_id: string; fees_month: string; fees_amount: number;
  discount: number; late_fees: number; total_amount: number; payment_date: string;
  payment_mode: string; receipt_number: string | null; remarks: string | null;
};
type Student = { id: string; student_name: string; monthly_fees: number | null };

const modes = ["Cash", "Google Pay", "PhonePe", "Paytm", "UPI", "Net Banking", "Cheque"];

function currentMonth() {
  const d = new Date(); return `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
}

function FeesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["students-min", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id,student_name,monthly_fees").order("student_name");
      return (data ?? []) as Student[];
    },
  });

  const { data: fees = [] } = useQuery({
    queryKey: ["fees", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("fees_payments").select("*").order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Fee[];
    },
  });

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s.student_name])), [students]);

  const filtered = fees.filter((f) => {
    const name = studentMap.get(f.student_id) ?? "";
    return (search === "" || name.toLowerCase().includes(search.toLowerCase()) || f.fees_month.toLowerCase().includes(search.toLowerCase()))
      && (modeFilter === "all" || f.payment_mode === modeFilter);
  });

  const total = filtered.reduce((s, f) => s + Number(f.total_amount), 0);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fees_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Payment removed"); qc.invalidateQueries({ queryKey: ["fees"] }); },
  });

  const receipt = (f: Fee) => {
    const name = studentMap.get(f.student_id) ?? "Student";
    const html = `<html><head><title>Receipt ${f.receipt_number ?? f.id.slice(0,8)}</title>
    <style>body{font-family:sans-serif;padding:32px;max-width:520px;margin:auto}
    h1{color:#2563EB;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}
    td{padding:8px 0;border-bottom:1px solid #eee}.tot{font-weight:700;color:#2563EB}</style></head>
    <body><h1>Payment Receipt</h1><div>Receipt #: ${f.receipt_number ?? f.id.slice(0,8)}</div>
    <div>Date: ${f.payment_date}</div><hr/>
    <table>
      <tr><td>Student</td><td style="text-align:right">${name}</td></tr>
      <tr><td>Month</td><td style="text-align:right">${f.fees_month}</td></tr>
      <tr><td>Fees</td><td style="text-align:right">₹${f.fees_amount}</td></tr>
      <tr><td>Discount</td><td style="text-align:right">-₹${f.discount}</td></tr>
      <tr><td>Late Fees</td><td style="text-align:right">₹${f.late_fees}</td></tr>
      <tr class="tot"><td>Total Paid</td><td style="text-align:right">₹${f.total_amount}</td></tr>
      <tr><td>Mode</td><td style="text-align:right">${f.payment_mode}</td></tr>
    </table>
    <p style="margin-top:24px;color:#64748b;font-size:12px">Thank you!</p>
    <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close();
  };

  return (
    <div>
      <PageHeader title="Fees Received" subtitle={`₹${total.toLocaleString()} shown`} action={
        <Button size="sm" onClick={() => setOpen(true)} className="gradient-brand text-primary-foreground"><Plus className="w-4 h-4 mr-1" />Record</Button>
      } />
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search student or month" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment modes</SelectItem>
            {modes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center shadow-card">
            <Wallet className="w-10 h-10 mx-auto text-primary" />
            <div className="mt-3 font-semibold">No payments</div>
            <div className="text-sm text-muted-foreground">Record your first payment.</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((f) => (
              <Card key={f.id} className="p-3 flex items-center gap-3 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{studentMap.get(f.student_id) ?? "Student"}</div>
                  <div className="text-xs text-muted-foreground truncate">{f.fees_month} · {f.payment_mode} · {f.payment_date}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">₹{Number(f.total_amount).toLocaleString()}</div>
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => receipt(f)}><Download className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete payment?")) del.mutate(f.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FeeDialog open={open} onOpenChange={setOpen} students={students} onSaved={() => qc.invalidateQueries({ queryKey: ["fees"] })} />
    </div>
  );
}

function FeeDialog({ open, onOpenChange, students, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; students: Student[]; onSaved: () => void }) {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [feesMonth, setFeesMonth] = useState(currentMonth());
  const [amount, setAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [late, setLate] = useState<number>(0);
  const [mode, setMode] = useState("Cash");
  const [receipt, setReceipt] = useState("");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const total = Math.max(0, Number(amount) - Number(discount) + Number(late));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!studentId) throw new Error("Select a student");
      const { error } = await supabase.from("fees_payments").insert({
        teacher_id: user.id, student_id: studentId, fees_month: feesMonth,
        fees_amount: amount, discount, late_fees: late, total_amount: total,
        payment_date: date, payment_mode: mode, receipt_number: receipt || null, remarks: remarks || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fees recorded successfully"); onSaved(); onOpenChange(false); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = () => { setStudentId(""); setAmount(0); setDiscount(0); setLate(0); setReceipt(""); setRemarks(""); };

  const onSelectStudent = (id: string) => {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    if (s?.monthly_fees) setAmount(Number(s.monthly_fees));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
          <FD label="Student *">
            <Select value={studentId} onValueChange={onSelectStudent}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.student_name}</SelectItem>)}</SelectContent>
            </Select>
          </FD>
          <FD label="Fees Month"><Input value={feesMonth} onChange={(e) => setFeesMonth(e.target.value)} /></FD>
          <div className="grid grid-cols-3 gap-2">
            <FD label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></FD>
            <FD label="Discount"><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></FD>
            <FD label="Late fees"><Input type="number" value={late} onChange={(e) => setLate(Number(e.target.value))} /></FD>
          </div>
          <div className="rounded-lg bg-muted p-3 flex justify-between items-center">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold text-primary">₹{total.toLocaleString()}</span>
          </div>
          <FD label="Payment Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FD>
          <FD label="Payment Mode">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{modes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </FD>
          <FD label="Receipt No."><Input value={receipt} onChange={(e) => setReceipt(e.target.value)} /></FD>
          <FD label="Remarks"><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></FD>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} className="gradient-brand text-primary-foreground">
              {save.isPending ? "Saving…" : "Save & generate receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FD({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
