import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
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

          <Suspense fallback={<div className="mt-8 text-sm text-muted-foreground">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Right */}
        <div className="hidden md:block bg-gradient-to-br from-muted to-background p-8">
          <div className="h-full w-full rounded-3xl bg-[url('/images/login.jpg')] bg-cover bg-center border" />
        </div>
      </div>
    </div>
  );
}