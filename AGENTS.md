# AGENTS.md — SaaS de Cursos

Guía para agentes de código. Fuente de verdad de las variables de entorno: [`.env.example`](.env.example).

## 1. Qué es

Plataforma de cursos online. Roles: **admin** (CRUD de cursos → secciones → recursos, lee el feedback) y
**student** (ve cursos publicados, lee recursos en markdown en orden y deja feedback por recurso).
Login por magic link (sin contraseñas). UI en español; código, rutas y colecciones en inglés.

## 2. Stack

Next.js 16.2 (App Router, `proxy.ts`) · React 19 · Tailwind CSS 4 · MongoDB driver nativo (BD `saas-cursos`) ·
`react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-sanitize` · `jose` · `nodemailer`/`resend` ·
AWS SDK v3 (S3: RustFS local / Cloudflare R2 prod) · Vitest · Playwright · Node 22 (`.nvmrc`).

## 3. Comandos

```bash
cp .env.example .env.local     # una vez
npm install
npm run infra:up               # Mongo 7 + MailHog + RustFS y crea el bucket
npm run seed                   # idempotente. seed:reset borra y recrea (solo local)
npm run dev                    # http://localhost:3000 · MailHog http://localhost:8025 · RustFS :9001
npm run lint && npm run typecheck && npm run test && npm run build
npm run test:e2e               # suite completa (levanta su propio servidor)
npx playwright test tests/e2e/auth.spec.ts -g "logout"    # un solo test
npm run infra:down
```

Si el puerto 27017 está ocupado: `MONGO_PORT=27018 npm run infra:up` y `MONGODB_URI=mongodb://localhost:27018`.
