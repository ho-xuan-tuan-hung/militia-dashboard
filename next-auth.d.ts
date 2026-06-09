import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      tieuDoi?: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    tieuDoi?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole;
    tieuDoi?: number;
    userId: string;
  }
}
