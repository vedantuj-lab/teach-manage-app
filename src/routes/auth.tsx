import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Tuition Class Manager" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
        setMode("signin");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-muted">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shadow-elevated mb-3">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tuition Class Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">For teachers & tuition owners</p>
        </div>
        <Card className="p-6 shadow-card">
          {mode !== "forgot" ? (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field id="email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="password" label="Password" type="password" value={password} onChange={setPassword} />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                      Remember me
                    </label>
                    <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <SubmitBtn loading={loading}>Sign in</SubmitBtn>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field id="name" label="Your name" value={name} onChange={setName} />
                  <Field id="email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="password" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn loading={loading}>Create teacher account</SubmitBtn>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="font-semibold">Reset password</h2>
                <p className="text-sm text-muted-foreground">Enter your email — we'll send you a reset link.</p>
              </div>
              <Field id="email" label="Email" type="email" value={email} onChange={setEmail} />
              <SubmitBtn loading={loading}>Send reset link</SubmitBtn>
              <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-primary hover:underline">
                Back to sign in
              </button>
            </form>
          )}
        </Card>
        <p className="text-xs text-center text-muted-foreground mt-6">
          Only teachers can sign in. Students & parents do not need accounts.
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange }: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required autoComplete={type === "password" ? "current-password" : "on"} />
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={loading} className="w-full gradient-brand text-primary-foreground shadow-elevated">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </Button>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Link };
