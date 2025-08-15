import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
    }
  }
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email or RegNo', type: 'text'  },
        password: { label: 'Password',       type: 'password' },
        role:     { label: 'Role',           type: 'hidden' },
      },
      async authorize(credentials) {
        const { email, password, role } = credentials as { email?: string; password?: string; role?: string };
        if (!email || !password || !role) return null

        if (role === 'admin') {
          const admin = await prisma.admin.findUnique({ where: { email } })
          if (!admin) return null
          if (!(await bcrypt.compare(password, admin.passwordHash)))
            return null
          return {
            id:    admin.id.toString(),
            name:  admin.email,
            email: admin.email,
            role:  'admin',
          }
        }

        // student
        const student = await prisma.student.findFirst({
          where: { OR: [{ email }, { regNo: email }] },
        })
        if (!student) return null
        if (!(await bcrypt.compare(password, student.passwordHash)))
          return null

        return {
          id:    student.id.toString(),
          name:  student.fullName,
          email: student.email,
          role:  'student',
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, persist all fields from the user object:
      if (user) {
        token.id    = user.id
        token.email = user.email
        token.name  = user.name
        token.role  = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Make sure session.user has id, email, name, and role:
      session.user.id    = token.id   as string
      session.user.email = token.email as string
      session.user.name  = token.name  as string
      session.user.role  = token.role  as string
      return session
    },
  },

  pages: {
    signIn: '/',       // your main login page
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
export default NextAuth(authOptions)
