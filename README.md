# 🎓 SaaS de Cursos — Plataforma de contenidos formativos

## 🌐 Demo / Despliegue

**URL pública:** [https://cursos.jpavon-tech.com](https://cursos.jpavon-tech.com)

CI/CD: GitLab CI (lint, typecheck, tests, E2E con Playwright) protege `main`; cada merge se despliega automáticamente vía mirror a GitHub → Vercel, verificado por un job post-deploy contra producción.

## 🎯 Objetivo del proyecto

Construir una **plataforma de cursos online** con dos roles: el **admin** mantiene los cursos y el **student** consume el contenido y deja feedback.

Con este proyecto el alumno aprende:

- A modelar una **jerarquía de contenidos**: Curso → Secciones → Recursos, con orden numérico.
- A renderizar **Markdown** en React (`react-markdown` + `remark-gfm` + `rehype-raw`), incluyendo vídeos embebidos.
- **Roles y permisos**: el mismo sistema se ve distinto según quién entra.
- Autenticación con **magic link** (sin contraseñas) vía MailHog.

## 🏗️ Arquitectura

```
┌──────────────┐         ┌──────────────────┐        ┌─────────────┐
│  Next.js     │ ──────► │  API Routes      │ ─────► │  MongoDB    │
│  admin/      │         │  cursos,         │        │ saas-cursos │
│  student/    │         │  secciones,      │        └─────────────┘
└──────────────┘         │  recursos,       │        ┌─────────────┐
                         │  feedback, auth  │ ─────► │  MailHog    │
                         └──────────────────┘        │ (magic link)│
                                                     └─────────────┘
```

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16.2 (App Router), React 19, Tailwind CSS 4 |
| Base de datos | MongoDB (driver nativo), BD `saas-cursos` |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-raw` |
| Auth | Magic link por email (MailHog en desarrollo) |
| Storage | S3 vía RustFS (Docker) para ficheros |

### Modelo de datos

```
User     { email, role: "admin"|"student", name }
Course   { title, description, slug, published }
Section  { courseId, title, order }            ← numeradas para mantener el orden
Resource { sectionId, courseId, title, order,  ← markdown con refs a vídeos/pdf
           content (markdown) }
Feedback { resourceId, userId, text, createdAt } ← asociado al recurso
```

## ⚙️ Funcionalidades

**Admin**: CRUD de cursos, de secciones dentro de cada curso y de recursos dentro de cada sección; ver el feedback que dejan los alumnos en cada recurso.

**Student**: listado de cursos publicados, navegación por secciones/recursos en orden, visualización del markdown renderizado (con vídeos de YouTube embebidos), y envío de feedback por recurso.

**Común**: landing profesional y login con magic link.

## 💡 Solución

1. **El orden importa**: secciones y recursos llevan un campo `order` numérico; las consultas ordenan por él, y el admin controla la secuencia pedagógica del curso.
2. **Markdown como formato de contenido**: en lugar de un editor WYSIWYG complejo, los recursos son markdown plano que puede referenciar vídeos o PDFs. `react-markdown` lo renderiza de forma segura, y `rehype-raw` permite HTML embebido (iframes de YouTube).
3. **Feedback ligado al recurso**: cada comentario guarda `resourceId` + `userId`, lo que permite al admin ver qué contenido funciona y cuál no.
4. **Roles en la sesión**: el magic link identifica al usuario y su rol viaja en la sesión; las rutas de administración comprueban `role === "admin"`.
5. El **seed** crea cursos de ejemplo con enlaces a vídeos de YouTube para poder probar la plataforma desde el primer arranque.

## 🚀 Cómo ejecutar

1. Arranca MongoDB local y MailHog en Docker (`docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog`).
2. Crea `.env.local` con `MONGODB_URI=mongodb://localhost:27017`, `MONGODB_DB=saas-cursos` y la config de MailHog.
3. Instala, siembra y arranca:

```bash
npm install
npx tsx scripts/seed.ts
npm run dev
```

4. Entra en [http://localhost:3000](http://localhost:3000) con el email del admin del seed; el magic link aparece en [http://localhost:8025](http://localhost:8025).

<!-- BEGIN cc:que-se-valora -->
¡Hola! Aquí te explico qué es lo que miraremos con lupa cuando corrijamos tu proyecto "Saas Cursos".

## 📋 Qué se valora

Cuando revisemos tu proyecto, lo que más pesa es que todo funcione como se espera y que hayas cumplido con todo lo que se pedía en el enunciado. También es importante que tu código esté bien escrito, sea fácil de entender y que la estructura general del proyecto tenga sentido. Le daremos un peso importante al vídeo demo, para ver cómo presentas tu trabajo y cómo funciona en vivo. Finalmente, aunque con un peso menor, nos fijaremos en la documentación que hayas incluido y en las decisiones que tomaste durante el desarrollo, para entender tu proceso.

Recuerda que el enunciado es la guía principal para tu proyecto, y la evaluación no penalizará nada que no se haya pedido explícitamente en él.
<!-- END cc:que-se-valora -->
