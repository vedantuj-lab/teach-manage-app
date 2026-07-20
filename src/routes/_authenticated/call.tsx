import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Phone, User, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/call")({
  head: () => ({ meta: [{ title: "Call" }] }),
  component: CallPage,
});

type Student = { id: string; student_name: string; mobile_number: string | null; parent_mobile_number: string | null; standard: string | null };

function CallPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: students = [] } = useQuery({
    queryKey: ["students-call", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id,student_name,mobile_number,parent_mobile_number,standard").eq("status", "Active").order("student_name");
      return (data ?? []) as Student[];
    },
  });

  const filtered = students.filter((s) => s.student_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Call" subtitle="Tap to dial" />
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search student" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id} className="p-3 shadow-card">
              <div className="font-semibold">{s.student_name}</div>
              {s.standard && <div className="text-xs text-muted-foreground">Std {s.standard}</div>}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <CallBtn label="Student" number={s.mobile_number} icon={User} />
                <CallBtn label="Parent" number={s.parent_mobile_number} icon={Users} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function CallBtn({ label, number, icon: Icon }: { label: string; number: string | null; icon: typeof Phone }) {
  const disabled = !number;
  return (
    <a href={disabled ? undefined : `tel:${number}`}
       className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${disabled ? "opacity-40 pointer-events-none" : "hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95"}`}>
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{number ?? "No number"}</div>
      </div>
      <Phone className="w-4 h-4" />
    </a>
  );
}
