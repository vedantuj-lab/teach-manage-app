import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut, KeyRound, GraduationCap, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile & Settings" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const [teacherName, setTeacherName] = useState("");
  const [className, setClassName] = useState("");
  const [logo, setLogo] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setTeacherName(profile.teacher_name ?? "");
      setClassName(profile.class_name ?? "");
      setLogo(profile.class_logo_url ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").upsert({
        id: user.id, teacher_name: teacherName, class_name: className, class_logo_url: logo || null, phone: phone || null, email: user.email,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePw = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Password changed"); setNewPassword(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const backup = async () => {
    if (!user) return;
    const [s, f, a, n] = await Promise.all([
      supabase.from("students").select("*"),
      supabase.from("fees_payments").select("*"),
      supabase.from("attendance").select("*"),
      supabase.from("notices").select("*"),
    ]);
    const dump = { exported_at: new Date().toISOString(), students: s.data, fees: f.data, attendance: a.data, notices: n.data };
    const url = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" }));
    const a2 = document.createElement("a"); a2.href = url; a2.download = `backup-${Date.now()}.json`; a2.click(); URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div>
      <PageHeader title="Profile & Settings" back={false} />
      <div className="p-4 space-y-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-brand text-primary-foreground flex items-center justify-center overflow-hidden">
              {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <GraduationCap className="w-7 h-7" />}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{teacherName || "Teacher"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <div className="space-y-3">
            <FieldRow label="Teacher name" value={teacherName} onChange={setTeacherName} />
            <FieldRow label="Class name" value={className} onChange={setClassName} />
            <FieldRow label="Class logo URL" value={logo} onChange={setLogo} placeholder="https://…" />
            <FieldRow label="Phone" value={phone} onChange={setPhone} />
            <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} className="w-full gradient-brand text-primary-foreground">
              {saveProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </Card>

        <Card className="p-4 shadow-card space-y-3">
          <div className="flex items-center gap-2 font-semibold"><KeyRound className="w-4 h-4" />Change password</div>
          <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Button variant="outline" onClick={() => changePw.mutate()} disabled={!newPassword || changePw.isPending} className="w-full">
            Update password
          </Button>
        </Card>

        <Card className="p-4 shadow-card space-y-2">
          <div className="font-semibold">Data</div>
          <Button variant="outline" onClick={backup} className="w-full"><Download className="w-4 h-4 mr-2" />Backup all data (JSON)</Button>
        </Card>

        <Button variant="outline" onClick={signOut} className="w-full text-destructive border-destructive/50 hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" />Sign out
        </Button>
      </div>
    </div>
  );
}

function FieldRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
