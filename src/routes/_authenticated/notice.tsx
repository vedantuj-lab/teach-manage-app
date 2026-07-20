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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Trash2, Megaphone, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notice")({
  head: () => ({ meta: [{ title: "Notice Board" }] }),
  component: NoticePage,
});

type Notice = { id: string; title: string; description: string | null; notice_date: string; category: string; attachment_url: string | null };
const categories = ["General", "Holiday", "Exam", "Fees", "Urgent", "Homework"];

const catColor: Record<string, string> = {
  Urgent: "bg-red-100 text-red-700",
  Holiday: "bg-emerald-100 text-emerald-700",
  Exam: "bg-amber-100 text-amber-700",
  Fees: "bg-blue-100 text-blue-700",
  Homework: "bg-violet-100 text-violet-700",
  General: "bg-slate-100 text-slate-700",
};

function NoticePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);

  const { data: notices = [] } = useQuery({
    queryKey: ["notices", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("notices").select("*").order("notice_date", { ascending: false });
      if (error) throw error;
      return data as Notice[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("notices").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Notice removed"); qc.invalidateQueries({ queryKey: ["notices"] }); },
  });

  const filtered = notices.filter((n) =>
    (filter === "all" || n.category === filter) &&
    (search === "" || n.title.toLowerCase().includes(search.toLowerCase()) || (n.description ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <PageHeader title="Notice Board" action={
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="gradient-brand text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" />New
        </Button>
      } />
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search notices" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center shadow-card">
            <Megaphone className="w-10 h-10 mx-auto text-primary" />
            <div className="mt-3 font-semibold">No notices</div>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <Card key={n.id} className="p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${catColor[n.category] ?? catColor.General} border-0`}>{n.category}</Badge>
                      <span className="text-xs text-muted-foreground">{n.notice_date}</span>
                    </div>
                    <div className="font-semibold mt-1.5">{n.title}</div>
                    {n.description && <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.description}</div>}
                    {n.attachment_url && (
                      <a href={n.attachment_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">
                        View attachment
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(n); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete notice?")) del.mutate(n.id); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NoticeDialog open={open} onOpenChange={setOpen} notice={editing} onSaved={() => qc.invalidateQueries({ queryKey: ["notices"] })} />
    </div>
  );
}

function NoticeDialog({ open, onOpenChange, notice, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; notice: Notice | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(notice?.title ?? "");
  const [desc, setDesc] = useState(notice?.description ?? "");
  const [cat, setCat] = useState(notice?.category ?? "General");
  const [date, setDate] = useState(notice?.notice_date ?? new Date().toISOString().slice(0, 10));
  const [att, setAtt] = useState(notice?.attachment_url ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const payload = { teacher_id: user.id, title, description: desc || null, category: cat, notice_date: date, attachment_url: att || null };
      if (notice) {
        const { error } = await supabase.from("notices").update(payload).eq("id", notice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notices").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(notice ? "Notice updated" : "Notice published"); onSaved(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (o) { setTitle(notice?.title ?? ""); setDesc(notice?.description ?? ""); setCat(notice?.category ?? "General"); setDate(notice?.notice_date ?? new Date().toISOString().slice(0,10)); setAtt(notice?.attachment_url ?? ""); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{notice ? "Edit notice" : "New notice"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!title) return toast.error("Title required"); save.mutate(); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Attachment URL</Label><Input value={att} onChange={(e) => setAtt(e.target.value)} placeholder="https://…" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} className="gradient-brand text-primary-foreground">
              {save.isPending ? "Saving…" : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
