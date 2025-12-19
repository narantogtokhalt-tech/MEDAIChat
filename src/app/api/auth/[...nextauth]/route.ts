// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8010";

// ✅ Backend require_key-д хэрэгтэй (server-only env)
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || "secret123";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  // ✅ prod дээр debug унтарна
  debug: process.env.NODE_ENV !== "production",

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const url = `${BACKEND_URL}/auth/login`;

        let res: Response;
        try {
          res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": BACKEND_API_KEY,
            },
            body: JSON.stringify({ email, password }),
          });
        } catch (err) {
          console.error("❌ Fetch error:", err);
          return null;
        }

        let data: any = null;
        try {
          data = await res.json();
        } catch (err) {
          console.error("❌ JSON parse error:", err);
          data = null;
        }

        if (!res.ok) return null;
        if (!data?.user?.id) return null;

        return {
          id: data.user.id,
          name: data.user.name ?? data.user.email ?? "User",
          email: data.user.email ?? email,
          role: data.user.role ?? "user",
          accessToken: data.accessToken ?? null,
        } as any;
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.accessToken = u.accessToken ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      (session as any).accessToken = (token as any).accessToken ?? null;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };