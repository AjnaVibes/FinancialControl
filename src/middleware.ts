import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

// Protege únicamente dashboard (ajusta si quieres más rutas)
export const config = {
  matcher: ["/dashboard/:path*"],
};
