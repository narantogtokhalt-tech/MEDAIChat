"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!res) throw new Error("No response from auth server");
      if (res.error) throw new Error("Имэйл эсвэл нууц үг буруу байна");

      window.location.href = res.url ?? callbackUrl;
    } catch (e: any) {
      setErr(e?.message ?? "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
          placeholder="admin@med.gov.mn"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2"
          placeholder="••••••••"
        />
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
          {err}
        </div>
      )}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-medium disabled:opacity-60"
        type="submit"
      >
        {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
      </button>

      <p className="text-xs text-muted-foreground">© MED — Internal use</p>
    </form>
  );
}