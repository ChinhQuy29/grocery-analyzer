import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/mongodb"
import { compare } from "bcryptjs"
import { User } from "@/lib/models"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectToDatabase()

        const user = await User.findOne({ email: credentials.email })

        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          goal: user.goal,
          measurements: user.measurements || undefined,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.goal = user.goal
        token.name = user.name
        token.email = user.email
        token.measurements = user.measurements
      }
      
      // Handle updates to the session
      if (trigger === "update" && session) {
        if (session.goal) token.goal = session.goal
        if (session.name) token.name = session.name
        if (session.email) token.email = session.email
        if (session.measurements) token.measurements = session.measurements
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.goal = token.goal as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.measurements = token.measurements
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

