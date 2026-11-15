import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createServiceClient } from "./supabase/server";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 jam
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = createServiceClient();

          const { data: admin, error } = await supabase
            .from("admins")
            .select("id, email, password_hash, name")
            .eq("email", credentials.email.toLowerCase().trim())
            .single();

          // Email tidak ditemukan
          if (error || !admin) {
            throw new Error("EMAIL_NOT_FOUND");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            admin.password_hash
          );

          // Password salah
          if (!isValid) {
            throw new Error("WRONG_PASSWORD");
          }

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
          };
        } catch (err: any) {
          // Teruskan error code agar bisa dibaca di halaman login
          throw new Error(err.message || "UNKNOWN_ERROR");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
