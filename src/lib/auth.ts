// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          hd: process.env.ALLOWED_DOMAINS,
        },
      },
    }),
  ],
  
  session: { 
    strategy: "jwt",
    // Sesión expira a las 9 PM del día actual
    maxAge: (() => {
      const now = new Date();
      const tonight = new Date(now);
      tonight.setHours(21, 0, 0, 0); // 9 PM
      
      // Si ya pasaron las 9 PM, configurar para mañana a las 9 PM
      if (now >= tonight) {
        tonight.setDate(tonight.getDate() + 1);
      }
      
      // Calcular segundos hasta las 9 PM
      const secondsUntil9PM = Math.floor((tonight.getTime() - now.getTime()) / 1000);
      return secondsUntil9PM;
    })(),
  },
  
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login",
  },
  
  callbacks: {
    async signIn({ user }) {
      console.log('🔐 Intento de login:', user.email);
      
      const allowed = (process.env.ALLOWED_DOMAINS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!allowed.length) {
        console.log('⚠️ No hay dominios configurados, permitiendo acceso');
        return true;
      }

      const domain = user.email?.split("@")[1] ?? "";
      const isAllowed = allowed.includes(domain);
      
      console.log(isAllowed ? '✅ Dominio permitido' : '❌ Dominio no permitido', {
        domain,
        allowed
      });
      
      return isAllowed;
    },

    async jwt({ token, user, trigger, session }) {
      // Siempre verificar el estado actual del usuario en la BD
      const userEmail = user?.email || token?.email;
      
      if (userEmail) {
        const dbUser = await prisma.user.findUnique({
          where: { email: userEmail as string },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            },
            companies: {
              include: {
                company: true
              }
            }
          }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role?.name || null;
          token.roleId = dbUser.roleId;
          token.isActive = dbUser.isActive;
          token.hasCompanies = dbUser.companies.length > 0;
          token.permissions = dbUser.role?.permissions.map(rp => ({
            resource: rp.permission.resource,
            action: rp.permission.action
          })) || [];
          
          console.log('✅ JWT actualizado:', {
            email: token.email,
            role: token.role,
            isActive: token.isActive,
            hasCompanies: token.hasCompanies
          });
        }
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | null;
        session.user.roleId = token.roleId as string | null;
        session.user.isActive = token.isActive as boolean;
        session.user.hasCompanies = token.hasCompanies as boolean;
        session.user.permissions = token.permissions as any[];
        
        // Determinar si el usuario está pendiente de aprobación
        session.user.isPending = !token.role || !token.hasCompanies;
        
        console.log('✅ Sesión actualizada:', {
          email: session.user.email,
          role: session.user.role,
          isPending: session.user.isPending
        });
      }

      return session;
    },

    // ✅ ESTE ES EL QUE FALTA - Callback de redirección
    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirigiendo:', { url, baseUrl });
      
      // Si la URL es relativa, usar baseUrl
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log('✅ Redirigiendo a:', redirectUrl);
        return redirectUrl;
      }
      
      // Si la URL es del mismo origen, permitir
      if (new URL(url).origin === baseUrl) {
        console.log('✅ Redirigiendo a:', url);
        return url;
      }
      
      // Por defecto, ir al dashboard
      const defaultUrl = `${baseUrl}/dashboard`;
      console.log('✅ Redirigiendo al dashboard:', defaultUrl);
      return defaultUrl;
    },
  },

  debug: process.env.NODE_ENV === 'development',
  
  events: {
    async signIn(message) {
      console.log('✅ Usuario inició sesión:', message.user.email);
    },
    async signOut(message) {
      console.log('👋 Usuario cerró sesión');
    },
  },
};

export default authOptions;
