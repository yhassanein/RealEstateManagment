import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    navigate(
      profile?.role === "owner" ? "/owner/dashboard" : "/tenant/dashboard",
      { replace: true },
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center bg-foreground">
              <span className="text-xs font-black text-white tracking-tighter">K</span>
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">H&H Real Estate</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none">H&H<br />Real Estate</h1>
          <p className="text-sm text-muted-foreground mt-3">Sign in to continue.</p>
        </div>

        {/* Form */}
        <div className="border border-border bg-white/85 backdrop-blur-md p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 rounded-none border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 rounded-none border-border"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-1 rounded-none font-bold uppercase tracking-widest text-xs"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
