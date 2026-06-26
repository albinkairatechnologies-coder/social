import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

import FacebookProvider from "next-auth/providers/facebook";
import InstagramProvider from "next-auth/providers/instagram";
import LinkedInProvider from "next-auth/providers/linkedin";

export const authOptions: AuthOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "mock_fb",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "mock_fb",
    }),
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID || "mock_ig",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "mock_ig",
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || "mock_li",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "mock_li",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "creator@socialforge.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        // Find the user by email in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Validate the hashed password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
