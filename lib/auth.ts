import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import User, { type UserRole } from "@/models/User";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set");
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const start = Date.now();

        await connectDB();

        // Try MongoDB user first
        const dbUser = await User.findOne({
          username: credentials.username.toLowerCase().trim(),
          active: true,
        }).lean();

        let isValid = false;
        let authUser: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          tieuDoi?: number;
          militiaId?: string;
        } | null = null;

        if (dbUser) {
          isValid = await verifyPassword(
            credentials.password,
            dbUser.passwordHash
          );
          if (isValid) {
            authUser = {
              id: dbUser._id.toString(),
              name: dbUser.hoTen,
              email: dbUser.username,
              role: dbUser.role,
              tieuDoi: dbUser.tieuDoi,
              militiaId: dbUser.militiaId?.toString(),
            };
          }
        } else {
          // Fallback: env-var admin for initial setup / migration
          const adminUsername = process.env.ADMIN_USERNAME;
          const adminPassword = process.env.ADMIN_PASSWORD;
          if (
            adminUsername &&
            adminPassword &&
            credentials.username === adminUsername &&
            credentials.password === adminPassword
          ) {
            isValid = true;
            authUser = {
              id: "env-admin",
              name: "Admin",
              email: adminUsername,
              role: "admin" as UserRole,
            };
          }
        }

        // Always take at least 500ms to deter brute-force timing attacks
        const elapsed = Date.now() - start;
        if (elapsed < 500) {
          await new Promise((r) => setTimeout(r, 500 - elapsed));
        }

        return isValid ? authUser : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as typeof user & { role: UserRole; tieuDoi?: number; militiaId?: string };
        token.role = u.role;
        token.tieuDoi = u.tieuDoi;
        token.militiaId = u.militiaId;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.tieuDoi = token.tieuDoi;
        session.user.militiaId = token.militiaId;
        session.user.id = token.userId;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
