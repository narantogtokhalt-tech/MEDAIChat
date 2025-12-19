"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
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
        redirect: false, // ❗ өөрсдөө handle хийнэ
        email,
        password,
        callbackUrl,
      });

      if (!res) {
        throw new Error("No response from auth server");
      }

      if (res.error) {
        throw new Error("Имэйл эсвэл нууц үг буруу байна");
      }

      // ✅ амжилттай → redirect
      window.location.href = res.url ?? callbackUrl;
    } catch (e: any) {
      setErr(e?.message ?? "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl rounded-3xl bg-background shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left */}
        <div className="p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            MED Dashboard
          </div>

          <h1 className="mt-8 text-3xl font-semibold">Нэвтрэх</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Албаны имэйл, нууц үгээ оруулна уу.
          </p>

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

            <p className="text-xs text-muted-foreground">
              © MED — Internal use
            </p>
          </form>
        </div>

        {/* Right */}
        <div className="hidden md:block bg-gradient-to-br from-muted to-background p-8">
          <div className="h-full w-full rounded-3xl bg-[url('/images/login.jpg')] bg-cover bg-center border" />
        </div>
      </div>
    </div>
  );
}