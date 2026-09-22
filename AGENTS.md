# AGENTS.md — SaaS de Cursos

Guía para agentes de código. La fuente de verdad de las variables de entorno es [`.env.example`](.env.example).

## 1. Qué es

Plataforma de cursos online con dos roles:

- **admin**: CRUD de cursos → secciones → recursos (markdown), reordena, publica y lee el feedback.
- **student**: ve los cursos publicados, lee los recursos en orden (markdown con vídeos de YouTube) y deja feedback por recurso.

Login por **magic link** (sin contraseñas). UI en español; código, rutas y colecciones en inglés.
Estado: **Bloques A y B completos**. En producción: [https://cursos.jpavon-tech.com](https://cursos.jpavon-tech.com).

## 2. Stack

Next.js 16.2 (App Router, `proxy.ts`) · React 19 · Tailwind CSS 4 (+ `@tailwindcss/typography`) · MongoDB driver nativo
(BD `saas-cursos`) · `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-sanitize` · `jose` (sesión) ·
`nodemailer` (MailHog) / `resend` · AWS SDK v3 (S3: RustFS local, Cloudflare R2 en prod) · `zod` 4 · Vitest · Playwright · Node 22 (`.nvmrc`).

## 3. Comandos

```bash
cp .env.example .env.local     # una vez; nunca se commitea
npm install
npm run infra:up               # Mongo 7 + MailHog + RustFS (docker compose)
npm run seed                   # idempotente (upserts). `npm run seed:reset` borra y recrea: SOLO local
npm run seed -- --only-admin   # solo el usuario admin (ADMIN_EMAIL)
npm run dev                    # (predev crea el bucket y su CORS; manual: npm run storage:init) http://localhost:3000 · MailHog http://localhost:8025 · RustFS consola :9001
npm run lint && npm run typecheck && npm run test && npm run build
npm run test:e2e               # suite Playwright completa (levanta su propio servidor en :3100)
npm run test:e2e:smoke         # solo @smoke
npx playwright test tests/e2e/auth.spec.ts -g "logout"   # un solo test
npx playwright show-report     # informe HTML; trazas: npx playwright show-trace test-results/<test>/trace.zip
npm run infra:down
```

Primer login local: entra con `ADMIN_EMAIL` (por defecto `admin@example.com`), abre MailHog en :8025 y pulsa el enlace → "Continuar".
Students del seed: `student1@example.com`, `student2@example.com`, `student3@example.com`.

**Puerto 27017 ocupado** (p. ej. un `mongod` de Homebrew): `MONGO_PORT=27018 npm run infra:up` y pon `MONGODB_URI=mongodb://localhost:27018` en `.env.local`.
Los E2E y `npm run dev` no pueden correr a la vez en el mismo directorio (comparten el lock de `next dev`): para E2E detén tu `dev`.

## 4. Mapa de carpetas

```
app/                    Rutas (App Router)
  page.tsx              Landing pública
  login/  auth/verify/  Solicitud del magic link y confirmación (botón "Continuar" = POST)
  admin/                Cursos, secciones, recursos, feedback (layout con guard de rol)
  student/              (browse)/ listado · courses/[slug]/ curso · courses/[slug]/[resourceId]/ recurso
  api/                  auth/{request,verify,logout} · courses · sections · resources (+ /reorder)
                        feedback · uploads · files/[...key] · health
components/             UI compartida; markdown.tsx (<Markdown />, editor y student), admin/*
lib/
  env.ts                Validación zod; `getEnv()` perezoso, se ejecuta al arrancar (instrumentation.ts)
  db.ts                 Cliente Mongo cacheado en globalThis + ensureIndexes una vez por proceso
  auth/                 tokens (SHA-256), sesión (jose), guards (requireUser/requireRole/requirePageRole), next-path
  mail/                 Interfaz Mailer + smtp (MailHog) + resend + plantilla
  storage.ts            S3 (presign PUT/GET, claves `uploads/<uuid>/<nombre>`), bucket y CORS
  validators/           Esquemas zod de toda entrada
  repositories/         ÚNICO punto de acceso a Mongo (+ indexes.ts, outline.ts)
  http.ts               `route()` (Origin + errores JSON), ApiError · order.ts · slug.ts · seed-guard.ts
  markdown-schema.ts    Esquema de sanitización (solo iframes de YouTube)
  security-headers.ts   CSP y cabeceras (usadas por next.config.ts)
proxy.ts                Protege /admin/** y /student/** (Next 16: sustituye a middleware)
scripts/                seed.ts, seed-data.ts, init-storage.ts
tests/unit/             Vitest · tests/e2e/ Playwright
docker-compose.yml  .env.example  playwright.config.ts
```

## 5. Modelo de datos y reglas

```
User     { email (único), role: "admin"|"student", name }
Course   { title, description, slug (único), published }
Section  { courseId, title, order }
Resource { sectionId, courseId, title, order, content (markdown) }
Feedback { resourceId, userId, text (1–2000), createdAt }
magic_tokens { tokenHash, email, next?, expiresAt (TTL), usedAt? }   rate_limits { _id, count, expiresAt (TTL) }
```

- `order` es numérico (base 1) y **toda consulta de secciones/recursos ordena por él**. Reordenar = `POST /api/{sections,resources}/reorder` con `{ parentId, ids }` (permutación exacta; si no, 400).
- **Borrado en cascada** curso → secciones → recursos → feedback (en `lib/repositories`, orden hijos→padre; Mongo standalone no admite transacciones).
- `slug` único (índice); duplicado → 409.
- El student solo ve `published: true`; un curso/recurso no publicado es **404** (página y API).
- Índices en `ensureIndexes()` (idempotente, se invoca desde `getDb()`).

## 6. Convenciones

- Código, rutas y colecciones en **inglés**; textos de UI en **español**, tono directo, sentence case.
- **zod en toda entrada** (`lib/validators`). Errores de API con forma `{ error: { code, message } }`.
- Acceso a Mongo **solo vía `lib/repositories`**. Las páginas server leen repositorios; los mutadores del cliente llaman a las API Routes y hacen `router.refresh()`.
- **Guards obligatorios**: `requireRole("admin")` en toda API admin; `requirePageRole` en layouts. Envuelve cada handler con `route()` (comprueba `Origin` en POST/PUT/PATCH/DELETE).
- Rutas con Mongo/S3/mail: `runtime = "nodejs"`. Páginas con datos: `dynamic = "force-dynamic"`.
- Next 16: `params` y `searchParams` son `Promise`; `proxy.ts` (no `middleware.ts`). Docs en `node_modules/next/dist/docs/`.
- Diseño: señalética de transporte. Tokens en `app/globals.css` (`@theme`). Un curso es una línea: secciones = "tramos" (terminal cuadrada), recursos = "paradas" numeradas (`1.2`). Ámbar (`--color-signal`) solo marca la parada actual. Componente clave: clases `.route*` y `<CourseIndex />`.

## 7. Seguridad

- **Magic link**: token de 32 bytes, guardado **hasheado (SHA-256)**, TTL `MAGIC_LINK_TTL_MINUTES`, **un solo uso** (`findOneAndUpdate` atómico). Respuesta genérica al solicitar; el usuario se crea al verificar. El `GET` del enlace no gasta el token (botón "Continuar" = POST).
- **Rol**: sale de la sesión firmada (`jose`, HS256, cookie `HttpOnly`, `SameSite=Lax`, `Secure` con `APP_URL` https). `admin` solo si el email == `ADMIN_EMAIL` al verificar. **Nunca** se acepta el rol del cliente.
- `next` validado contra open-redirect (`isSafeNext`). Rate limit en Mongo por email (5/h) e IP (30/h).
- **Markdown**: `rehype-raw` + `rehype-sanitize` con `lib/markdown-schema.ts` (solo `<iframe>` `https://www.youtube[-nocookie].com/embed/<id>`). **No relajar el esquema sin revisión**; hay tests unitarios y E2E.
- Ficheros: subida por URL prefirmada PUT (tipos PDF/PNG/JPEG/WebP, máx. `MAX_UPLOAD_MB`); lectura `GET /api/files/<key>` exige sesión y responde 302 a URL prefirmada de 60 s. Solo se sirven claves `uploads/<uuid>/…`.
- CSP y cabeceras en `lib/security-headers.ts` (frame-src YouTube; img/connect-src con el host del storage).
- Secretos fuera del repo (`.env*` ignorados salvo `.env.example`). **`seed --reset` solo contra localhost/127.0.0.1/mongo** (`lib/seed-guard.ts`); jamás contra Atlas.

## 8. Testing

- **Unit (Vitest)**: `tests/unit` — orden, slug, validadores, env, sesión/tokens, storage keys, guarda del seed, sanitizador Markdown.
- **E2E (Playwright)**, `tests/e2e`: `globalSetup` ejecuta `seed --reset` sobre la BD **`saas-cursos-e2e`** (nunca la de desarrollo) y el servidor arranca con `MONGODB_DB` y `APP_URL` de E2E en `E2E_BASE_URL` (por defecto :3100). Local usa `next dev`; en CI (`process.env.CI`, GitLab lo define solo) usa `next start` (haz `npm run build` antes).
- El magic link se lee de la **API de MailHog** (`getMagicLink` en `helpers.ts`); `auth.setup.ts` guarda un `storageState` por rol (admin, student1, student2) en `tests/e2e/.auth/` (ignorado por git).
- Proyectos: `chromium` (todo) y `smoke` (solo `@smoke`, solo lectura, apto para producción: no siembra ni levanta servidor si `E2E_BASE_URL` no es local).
- Etiqueta `@storage`: requieren RustFS (S3). Para omitirlos: `npx playwright test --grep-invert @storage`.
- Datos únicos por test (sufijo aleatorio; `createCourseFixture`), sin dependencia de orden. Trazas/vídeo/captura solo en fallo (`playwright-report/`, `test-results/`).
- Tras `next dev` los tests que interactúan justo tras `goto` pueden adelantarse a la hidratación: usa `expect(...).toPass()` (ver `storage.spec.ts`).

## 9. CI/CD

**Flujo:** `feature/* → Merge Request → main`. Activa en GitLab (Settings → Merge requests) *"Pipelines must succeed"*
y prohíbe el push directo a `main` (Settings → Repository → Protected branches: solo Maintainers, o nadie, puede
hacer push; los merges requieren MR) — así solo código con CI en verde llega al mirror de GitHub y a Vercel.

**Pipeline** (`.gitlab-ci.yml`), etapas `install → quality → build → e2e → deploy-verify`:

- **Runner de este proyecto: `shell`, sin Docker** (confirmado en vivo: `image:` y `services:` se ignoran por completo). Todos los jobs llevan `tags: [cloudrun]` porque el único runner online no acepta jobs sin etiqueta (`run_untagged: false`).
- `quality`: `lint`, `typecheck`, `unit-test` (Vitest) en paralelo; `audit` (`npm audit --omit=dev --audit-level=high`) con `allow_failure: true`.
- `build`: `npm run build`; sube `.next/` como artefacto para el job `e2e`.
- `e2e`: como no hay Docker, **autoaloja Mongo/MailHog/RustFS como binarios** descargados y arrancados con `nohup` en el propio job (tarballs/releases oficiales; sin `--fork` en mongod, se cuelga en este contenedor). Instala Chromium con `npx playwright install --with-deps` (tampoco viene de una imagen). Corre `npm run test:e2e` completo (incluye `@storage`); sube `playwright-report/` y `test-results/` como artefactos (`when: always`).
  - **Gotcha real:** esta instancia de GitLab define una variable de CI **a nivel de instancia** `RUSTFS_ACCESS_KEY=minioadmin` (para prácticas con MinIO) que pisaba nuestras credenciales `rustfsadmin` declaradas en `variables:` — las de la UI ganan a las del YAML. Se corrige exportándolas explícitamente dentro del propio script, justo antes de arrancar RustFS.
  - `expect.timeout` sube a 15s y `retries` a 2 solo en CI (`playwright.config.ts`): Mongo+MailHog+RustFS+Chromium+Next comparten el mismo runner efímero y, bajo carga, un `router.refresh()` puede tardar más que en local.
- `deploy-verify` (**solo en `main`**): sondea `GET $PROD_URL/api/health` hasta que `commit === $CI_COMMIT_SHA` y `db === "ok"` (el mirror conserva el SHA), luego corre el proyecto `smoke` de Playwright contra `E2E_BASE_URL=$PROD_URL`. `PROD_URL` es una variable de CI **no secreta** (Settings → CI/CD → Variables), p. ej. `https://cursos.jpavon-tech.com`. Verificado en producción: los 5 tests `@smoke` pasan.
- Todas las credenciales del pipeline son **ficticias** (Mongo/MailHog/RustFS efímeros de CI); no hace falta ningún secreto real para que pase.
- Este runner compartido puede encolar jobs varios minutos (contención con otros proyectos de la academia); no es un fallo del pipeline.
- Si `deploy-verify` falla, el pipeline de `main` queda en rojo y GitLab lo notifica. **Rollback:** en Vercel → *Instant Rollback* al deploy anterior, y después revertir el commit correspondiente en GitLab (`git revert`) para que el historial no vuelva a desplegar el commit roto.

**Mirror y despliegue:** GitLab (fuente de verdad) → *push mirroring* (solo `main`) → GitHub → Vercel (Git integration, Node 22, rama de producción `main`). **No se despliega con Vercel CLI desde el pipeline.** Vercel construye en cada push al mirror sin conocer el estado del pipeline de GitLab: la única garantía de calidad es la protección de `main` de más arriba.

**Aviso importante sobre `next.config.ts`:** las cabeceras de seguridad y la CSP se aplican en `proxy.ts` (por
petición), no con `headers()` en `next.config.ts`. `headers()` se hornea en el build; si `S3_ENDPOINT` no
estuviera presente en ese momento (o cambiase después sin rebuild), la política quedaría desactualizada y
rompería en silencio las subidas a R2/RustFS. `proxy.ts` lee `getEnv()` en cada petición, así que siempre
refleja la configuración real del entorno en ejecución.

## 10. Entornos y variables

Ver `.env.example` (comentado: obligatoria/opcional, valor local y nota de producción). `lib/env.ts` aborta el arranque con un mensaje claro si falta algo.
Producción (Vercel): `MAIL_PROVIDER=resend` + `RESEND_API_KEY`, Atlas en `MONGODB_URI`, R2 en `S3_*` (`S3_REGION=auto`, `S3_FORCE_PATH_STYLE=false`), `AUTH_SECRET` ≥ 32 caracteres, `APP_URL=https://cursos.jpavon-tech.com`.
`lib/env.ts` aplica validación estricta cuando `APP_ENV=production` o `VERCEL_ENV=production`.

## 11. No hacer

- No crear otro `README.md` ni tocar el original sin que se pida.
- No commitear `.env*` (salvo `.env.example`) ni secretos en código, logs o commits.
- No ejecutar seeds destructivos fuera de local; no bajar la guarda de `seed-guard.ts`.
- No desplegar con Vercel CLI; no añadir dependencias de auth externas (Auth.js…) sin discutirlo.
- Fuera de alcance: pagos, progreso/completado, comentarios anidados, editor WYSIWYG, multi-tenant, i18n.

## 12. Definición de "hecho"

`npm run lint && npm run typecheck && npm run test` en verde, `npm run build` correcto y los E2E relevantes (o `npm run test:e2e`) en verde.
