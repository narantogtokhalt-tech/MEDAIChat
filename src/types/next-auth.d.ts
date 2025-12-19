import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }

  // ✅ authorize() буцаасан user дээр role/accessToken нэмнэ
  interface User {
    id: string;
    role?: string;
    accessToken?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    accessToken?: string | null;
  }
}