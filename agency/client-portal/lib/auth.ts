import NextAuth from "next-auth"
import Email from "next-auth/providers/email"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { getCrmUserByEmail } from "@/lib/crm-api"
import { getEnabledFeatures } from "@/lib/features"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    // Magic link via Resend
    Email({
      server: {
        host: process.env.EMAIL_HOST || "https://api.resend.com",
        port: Number(process.env.EMAIL_PORT) || 465,
        auth: {
          user: process.env.RESEND_API_KEY,
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM || "Portal <no-reply@ctwebsiteco.com>",
      maxAge: 60 * 60, // Magic link valid for 1 hour
    }),

    // Password provider — added after first login via magic link
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantId: { label: "TenantId", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const tenantId = (credentials.tenantId as string | undefined) ?? undefined

        const user = await prisma.portalUser.findUnique({
          where: {
            email_tenantId: { email, tenantId: tenantId ?? "" },
          },
          include: { tenant: true },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
          hasPassword: true,
          tenantType: user.tenant.type,
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
    newUser: "/onboarding",
  },

  callbacks: {
    async jwt({ token, user }) {
      // First sign-in (from magic link or credentials)
      if (user) {
        token.id = user.id
        const email = user.email ?? ""
        const crmUser = await getCrmUserByEmail(email)
        token.tenantId = crmUser?.tenant_id ?? null
        token.role = crmUser?.role ?? "EDITOR"
        token.hasPassword = crmUser?.has_password ?? false
        token.tenantType = "CLIENT"
      }
      // Embed enabled features in JWT (so middleware can read them on Edge Runtime)
      if (token.tenantId) {
        try {
          const features = await getEnabledFeatures(token.tenantId as string)
          token.enabledFeatures = features
        } catch {
          // Don't fail auth if feature flags can't be loaded
          token.enabledFeatures = {}
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
        session.user.role = token.role as string
        session.user.hasPassword = token.hasPassword as boolean
        session.user.tenantType = token.tenantType as string
        session.user.enabledFeatures = (token.enabledFeatures ?? {}) as Record<string, boolean>
      }
      return session
    },
  },

  cookies: {
    sessionToken: {
      name: "portal-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
})

// Extend NextAuth types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      tenantId: string
      role: string
      hasPassword: boolean
      tenantType: string
      enabledFeatures: Record<string, boolean>
    }
  }
}
