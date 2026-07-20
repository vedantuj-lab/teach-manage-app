import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Download, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({ meta: [{ title: "Students" }] }),
  component: StudentsPage,
});

type Student = {
  id: string; student_name: string; roll_number: string | null; standard: string | null;
  division: string | null; school_name: string | null; date_of_birth: string | null;
  gender: string | null; parent_name: string | null; father_name: string | null;
  mother_name: string | null; mobile_number: string | null; parent_mobile_number: string | null;
  email: string | null; address: string | null; admission_date: string | null;
  monthly_fees: number | null; subjects: string | null; batch_name: string | null;
  photo_url: string | null; remarks: string | null; status: string;
};

function StudentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "standard" | "batch">("name");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("student_name");
      if (error) throw error;
      return data as Student[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Student deleted"); qc.invalidateQueries({ queryKey: ["students"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = students
    .filter((s) => s.student_name.toLowerCase().includes(search.toLowerCase()) || (s.roll_number ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const key = sort === "name" ? "student_name" : sort === "standard" ? "standard" : "batch_name";
      return (a[key] ?? "").localeCompare(b[key] ?? "");
    });

  const exportCsv = () => {
    const headers = ["Name", "Roll", "Standard", "Batch", "Mobile", "Parent Mobile", "Monthly Fees", "Status"];
    const rows = filtered.map((s) => [s.student_name, s.roll_number, s.standard, s.batch_name, s.mobile_number, s.parent_mobile_number, s.monthly_fees, s.status]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "students.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Students" subtitle={`${students.length} total`} action={
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="gradient-brand text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      } />
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or roll no." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="standard">Sort by Standard</SelectItem>
              <SelectItem value="batch">Sort by Batch</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />Export</Button>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-10">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => { setEditing(null); setOpen(true); }} />
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <Card key={s.id} className="p-3 flex items-center gap-3 shadow-card">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {s.photo_url ? <img src={s.photo_url} alt="" className="w-full h-full object-cover" /> : <GraduationCap className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{s.student_name}</span>
                    {s.status !== "Active" && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[s.standard && `Std ${s.standard}`, s.batch_name, s.roll_number && `#${s.roll_number}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this student?")) del.mutate(s.id); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <StudentDialog open={open} onOpenChange={setOpen} student={editing} onSaved={() => qc.invalidateQueries({ queryKey: ["students"] })} />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-10 text-center shadow-card">
      <GraduationCap className="w-10 h-10 mx-auto text-primary" />
      <div className="mt-3 font-semibold">No students yet</div>
      <div className="text-sm text-muted-foreground">Add your first student to get started.</div>
      <Button onClick={onAdd} className="mt-4 gradient-brand text-primary-foreground"><Plus className="w-4 h-4 mr-1" />Add student</Button>
    </Card>
  );
}

function StudentDialog({ open, onOpenChange, student, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; student: Student | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<Student>>({});

  // Reset form on open/student change
  useState(() => setForm(student ?? { status: "Active" }));
  // Simple effect via key prop below; re-run when student changes
  if (open && form.id !== (student?.id ?? undefined) && !(student === null && !form.id)) {
    // no-op; controlled below via effect-like key
  }

  const save = useMutation({
    mutationFn: async (payload: Partial<Student>) => {
      if (!user) throw new Error("Not signed in");
      const record = { ...payload, teacher_id: user.id };
      if (student) {
        const { error } = await supabase.from("students").update(record).eq("id", student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert(record as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(student ? "Student updated" : "Student added successfully"); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_name) return toast.error("Name is required");
    save.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o) setForm(student ?? { status: "Active" }); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{student ? "Edit student" : "Add student"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <F label="Student Name *" className="col-span-2"><Input required value={form.student_name ?? ""} onChange={(e) => setForm({ ...form, student_name: e.target.value })} /></F>
          <F label="Roll No."><Input value={form.roll_number ?? ""} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} /></F>
          <F label="Standard"><Input value={form.standard ?? ""} onChange={(e) => setForm({ ...form, standard: e.target.value })} /></F>
          <F label="Division"><Input value={form.division ?? ""} onChange={(e) => setForm({ ...form, division: e.target.value })} /></F>
          <F label="Batch"><Input value={form.batch_name ?? ""} onChange={(e) => setForm({ ...form, batch_name: e.target.value })} /></F>
          <F label="School" className="col-span-2"><Input value={form.school_name ?? ""} onChange={(e) => setForm({ ...form, school_name: e.target.value })} /></F>
          <F label="Date of Birth"><Input type="date" value={form.date_of_birth ?? ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></F>
          <F label="Gender">
            <Select value={form.gender ?? ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Parent Name"><Input value={form.parent_name ?? ""} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} /></F>
          <F label="Father Name"><Input value={form.father_name ?? ""} onChange={(e) => setForm({ ...form, father_name: e.target.value })} /></F>
          <F label="Mother Name"><Input value={form.mother_name ?? ""} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} /></F>
          <F label="Student Mobile"><Input value={form.mobile_number ?? ""} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} /></F>
          <F label="Parent Mobile"><Input value={form.parent_mobile_number ?? ""} onChange={(e) => setForm({ ...form, parent_mobile_number: e.target.value })} /></F>
          <F label="Email" className="col-span-2"><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></F>
          <F label="Address" className="col-span-2"><Textarea rows={2} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></F>
          <F label="Admission Date"><Input type="date" value={form.admission_date ?? ""} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} /></F>
          <F label="Monthly Fees (₹)"><Input type="number" value={form.monthly_fees ?? ""} onChange={(e) => setForm({ ...form, monthly_fees: e.target.value ? Number(e.target.value) : 0 })} /></F>
          <F label="Subjects" className="col-span-2"><Input value={form.subjects ?? ""} onChange={(e) => setForm({ ...form, subjects: e.target.value })} /></F>
          <F label="Photo URL" className="col-span-2"><Input value={form.photo_url ?? ""} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" /></F>
          <F label="Remarks" className="col-span-2"><Textarea rows={2} value={form.remarks ?? ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></F>
          <F label="Status">
            <Select value={form.status ?? "Active"} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
            </Select>
          </F>
          <DialogFooter className="col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} className="gradient-brand text-primary-foreground">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _kh = DialogTrigger;
