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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, MessageSquare, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sms")({
  head: () => ({ meta: [{ title: "SMS" }] }),
  component: SMSPage,
});

type Student = { id: string; student_name: string; parent_mobile_number: string | null; mobile_number: string | null; standard: string | null; batch_name: string | null };

const templates: Record<string, string> = {
  Holiday: "Dear Parent, class will remain closed tomorrow due to holiday. Thank you.",
  "Time Change": "Dear Parent, please note the class timing has been changed. Kindly check.",
  "Extra Lecture": "Dear Parent, an extra lecture is scheduled. Please ensure your child attends.",
  "Exam Reminder": "Dear Parent, exam is scheduled. Please help your child prepare well.",
  "Fees Reminder": "Dear Parent, this is a gentle reminder about pending fees. Kindly clear at the earliest.",
  "General Announcement": "Dear Parent, kindly note the following important information.",
  "Custom Message": "",
};

function SMSPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [type, setType] = useState<string>("General Announcement");
  const [message, setMessage] = useState(templates["General Announcement"]);

  const { data: students = [] } = useQuery({
    queryKey: ["students-sms", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id,student_name,parent_mobile_number,mobile_number,standard,batch_name").eq("status", "Active").order("student_name");
      return (data ?? []) as Student[];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["sms-log", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sms_log").select("*").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const filtered = students.filter((s) => s.student_name.toLowerCase().includes(search.toLowerCase()));

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (selected.size === 0) throw new Error("Select at least one student");
      if (!message.trim()) throw new Error("Message is empty");
      const ids = Array.from(selected);
      const { error } = await supabase.from("sms_log").insert({
        teacher_id: user.id, message_type: type, message, recipient_ids: ids, recipient_count: ids.length, status: "Sent",
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("SMS sent successfully");
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["sms-log"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setTypeAndMsg = (t: string) => { setType(t); if (templates[t] !== undefined && templates[t]) setMessage(templates[t]); };

  return (
    <div>
      <PageHeader title="Send SMS" subtitle={`${selected.size} selected`} action={
        <Button size="sm" onClick={() => send.mutate()} disabled={send.isPending || selected.size === 0} className="gradient-brand text-primary-foreground">
          <Send className="w-4 h-4 mr-1" />Send
        </Button>
      } />
      <div className="p-4 space-y-3">
        <Card className="p-3 shadow-card space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Message type</Label>
            <Select value={type} onValueChange={setTypeAndMsg}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(templates).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message…" />
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search student" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="ghost" size="sm" onClick={toggleAll} className="ml-2">
            {selected.size === filtered.length && filtered.length > 0 ? "Clear" : "Select all"}
          </Button>
        </div>

        <div className="space-y-1.5">
          {filtered.map((s) => {
            const checked = selected.has(s.id);
            return (
              <Card key={s.id} className={`p-2.5 flex items-center gap-3 cursor-pointer transition-all ${checked ? "ring-2 ring-primary" : ""}`}
                onClick={() => { const n = new Set(selected); if (checked) n.delete(s.id); else n.add(s.id); setSelected(n); }}>
                <Checkbox checked={checked} onCheckedChange={() => {}} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{s.student_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.parent_mobile_number ?? s.mobile_number ?? "No number"}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {history.length > 0 && (
          <div className="pt-4">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" />Recent SMS</div>
            <div className="space-y-2">
              {history.map((h) => (
                <Card key={h.id} className="p-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">{h.message_type}</span>
                    <span className="text-xs text-muted-foreground">{h.recipient_count} recipient(s) · {h.status}</span>
                  </div>
                  <div className="text-sm mt-1 line-clamp-2">{h.message}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
