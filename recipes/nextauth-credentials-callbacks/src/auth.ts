import type { NextAuthOptions, User } from "next-auth";
import CredentialsImport from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// next-auth v4 ships CommonJS; under native ESM the default export arrives wrapped.
const CredentialsProvider = ((CredentialsImport as any).default ?? CredentialsImport) as typeof CredentialsImport;

export type DbUser = { id: string; email: string; passwordHash: string; role: "admin" | "member" };
export type UserRepo = { findByEmail: (email: string) => Promise<DbUser | null> };

export async function authorizeCredentials(repo: UserRepo, creds: Record<string, string> | undefined): Promise<User | null> {
  if (!creds?.email || !creds.password) return null;
  const u = await repo.findByEmail(creds.email.toLowerCase());
  if (!u || !(await bcrypt.compare(creds.password, u.passwordHash))) return null; // null => 401 CredentialsSignin
  return { id: u.id, email: u.email, role: u.role } as User;
}

export function buildAuthOptions(repo: UserRepo): NextAuthOptions {
  return {
    session: { strategy: "jwt" }, // Credentials provider requires JWT sessions
    providers: [CredentialsProvider({
      name: "Email",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      authorize: (creds) => authorizeCredentials(repo, creds),
    })],
    callbacks: {
      async jwt({ token, user }) {
        if (user) { token.uid = user.id; token.role = (user as any).role; } // only present on sign-in
        return token;
      },
      async session({ session, token }) {
        if (session.user) Object.assign(session.user, { id: token.uid, role: token.role });
        return session;
      },
    },
  };
}
// app/api/auth/[...nextauth]/route.ts:  const h = NextAuth(buildAuthOptions(repo)); export { h as GET, h as POST };
