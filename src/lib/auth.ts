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
    maxAge: 30 * 24 * 60 * 60,
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
      if (user) {
        console.log('🎫 Creando JWT para:', user.email);
        
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role?.name || 'viewer';
          token.permissions = dbUser.role?.permissions.map(rp => ({
            resource: rp.permission.resource,
            action: rp.permission.action
          })) || [];
          
          console.log('✅ JWT configurado:', {
            id: token.id,
            role: token.role,
            permissions: token.permissions.length
          });
        } else {
          console.log('⚠️ Usuario no encontrado en BD, asignando viewer');
          token.id = user.id;
          token.role = 'viewer';
          token.permissions = [];
        }
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      console.log('📝 Creando sesión para:', session.user?.email);
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as any[];
        
        console.log('✅ Sesión creada con rol:', token.role);
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