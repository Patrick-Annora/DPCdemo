import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Incorrect password");
        return;
      }

      const data = await res.json();
      onLogin(data.token);
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/dpc-logo.png"
            alt="Demand Planning Center"
            className="h-16 w-auto"
          />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Demand Planning Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter the demo password to continue
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-11 text-center text-sm"
            autoFocus
          />

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!password.trim() || loading}
            className="h-11 w-full bg-dpc-red hover:bg-dpc-red-light"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading ? "Signing in\u2026" : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          powered by <span className="font-medium text-slate-500">Annora</span>
        </p>
      </div>
    </div>
  );
}
