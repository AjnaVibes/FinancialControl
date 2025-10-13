# Financial Control System (Starter)

Generado automáticamente el 2025-10-12T03:26:37.509620 a partir de tu manual.

## Requisitos
- Node 18+
- MySQL 8+
- Variables de entorno configuradas (`.env`)

## Pasos rápidos
```bash
cp .env.example .env
# Edita DATABASE_URL y credenciales de Google
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
Abre http://localhost:3000

## Qué incluye
- Next.js 14 (App Router) + Tailwind
- Prisma (MySQL) con módulos CORE (Auth/Roles/Sync)
- NextAuth (Google OAuth) con restricción por dominio
- Estructura Atomic Design mínima (atoms/molecules/organisms/templates)
- Endpoints base y webhook placeholder para RAMP
- Dashboard inicial
