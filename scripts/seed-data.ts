/** Contenido del seed. Vídeos de YouTube verificados con oEmbed. */

export const YOUTUBE = {
  typescript: "zQnBQ4tB3ZA", // TypeScript in 100 Seconds (Fireship)
  rest: "lsMQRaeKNDk", // What is a REST API? (IBM Technology)
  docker: "Gjnup-PuquQ", // Docker in 100 Seconds (Fireship)
} as const;

const PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const video = (id: string, title: string) =>
  `<iframe src="https://www.youtube.com/embed/${id}" title="${title}" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;

export interface SeedResource {
  title: string;
  content: string;
}
export interface SeedSection {
  title: string;
  resources: SeedResource[];
}
export interface SeedCourse {
  slug: string;
  title: string;
  description: string;
  published: boolean;
  sections: SeedSection[];
}

export const SEED_STUDENTS = [
  { email: "student1@example.com", name: "Lucía Fernández" },
  { email: "student2@example.com", name: "Marcos Ortega" },
  { email: "student3@example.com", name: "Irene Vidal" },
] as const;

export const SEED_COURSES: SeedCourse[] = [
  {
    slug: "typescript-desde-cero",
    title: "TypeScript desde cero",
    description: "Del primer tipo a los genéricos: aprende a escribir JavaScript que se explica solo y falla antes de llegar a producción.",
    published: true,
    sections: [
      {
        title: "Primeros pasos",
        resources: [
          {
            title: "Qué problema resuelve TypeScript",
            content: `JavaScript te deja pasar un número donde esperabas un texto y no protesta hasta que el programa ya está en marcha. TypeScript añade **tipos estáticos**: el editor te avisa *mientras escribes*.

## Míralo en 100 segundos

${video(YOUTUBE.typescript, "TypeScript en 100 segundos")}

## Lo que vas a conseguir

- Detectar errores de tipo antes de ejecutar.
- Autocompletado fiable en cualquier editor.
- Refactors seguros: renombrar sin miedo.

> TypeScript no cambia cómo se ejecuta tu código: se compila a JavaScript normal.
`,
          },
          {
            title: "Instalación y primer archivo",
            content: `## 1. Instala el compilador

\`\`\`bash
npm install --save-dev typescript
npx tsc --init
\`\`\`

## 2. Escribe tu primer archivo

\`\`\`ts
function saludar(nombre: string): string {
  return \`Hola, \${nombre}\`;
}

saludar("Ada");   // ✅
saludar(42);      // ❌ Argument of type 'number' is not assignable to 'string'
\`\`\`

## 3. Compila

\`\`\`bash
npx tsc
\`\`\`

Descarga la chuleta con los comandos más usados: [Chuleta de TypeScript (PDF)](${PDF_URL}).
`,
          },
        ],
      },
      {
        title: "Tipos en profundidad",
        resources: [
          {
            title: "Tipos básicos y uniones",
            content: `| Tipo | Ejemplo | Cuándo usarlo |
|---|---|---|
| \`string\` | \`"hola"\` | Texto |
| \`number\` | \`42\` | Enteros y decimales |
| \`boolean\` | \`true\` | Banderas |
| \`string[]\` | \`["a", "b"]\` | Listas |
| \`"admin" \\| "student"\` | \`"admin"\` | Valores cerrados (unión literal) |

## Uniones y estrechamiento

\`\`\`ts
type Rol = "admin" | "student";

function saludo(rol: Rol) {
  return rol === "admin" ? "Panel de control" : "Mis cursos";
}
\`\`\`

1. Declara la unión.
2. Comprueba el valor con \`if\` o \`switch\`.
3. TypeScript estrecha el tipo dentro de cada rama.
`,
          },
          {
            title: "Interfaces y genéricos",
            content: `## Interfaces

\`\`\`ts
interface Curso {
  id: string;
  titulo: string;
  publicado: boolean;
}
\`\`\`

## Genéricos

Un genérico es un tipo que recibe otro tipo como parámetro:

\`\`\`ts
function primero<T>(items: T[]): T | undefined {
  return items[0];
}

const c = primero<Curso>([]); // Curso | undefined
\`\`\`

- Usa genéricos cuando la lógica no depende del tipo concreto.
- Evita \`any\`: si no sabes el tipo, usa \`unknown\` y estréchalo.
`,
          },
        ],
      },
      {
        title: "Buenas prácticas",
        resources: [
          {
            title: "Configuración estricta y checklist",
            content: `Activa \`strict\` desde el primer día:

\`\`\`json
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true } }
\`\`\`

## Checklist antes de publicar

- [x] \`strict\` activado
- [x] Sin \`any\` implícitos
- [ ] Tipos compartidos en un único módulo
- [ ] \`tsc --noEmit\` en el CI

Material extra: [Guía de referencia (PDF)](${PDF_URL}).
`,
          },
        ],
      },
    ],
  },
  {
    slug: "apis-rest-con-criterio",
    title: "APIs REST con criterio",
    description: "Diseña APIs que otros equipos puedan usar sin leer tu código: recursos, verbos, errores y seguridad.",
    published: true,
    sections: [
      {
        title: "Fundamentos",
        resources: [
          {
            title: "Recursos, verbos y URLs",
            content: `${video(YOUTUBE.rest, "Qué es una API REST")}

## Cada verbo tiene un significado

| Verbo | Ruta | Efecto |
|---|---|---|
| \`GET\` | \`/courses\` | Lista cursos |
| \`POST\` | \`/courses\` | Crea un curso |
| \`PATCH\` | \`/courses/:id\` | Modifica campos |
| \`DELETE\` | \`/courses/:id\` | Elimina el curso |

Nombra **recursos** (sustantivos en plural), no acciones: \`/courses\`, no \`/getCourses\`.
`,
          },
          {
            title: "Códigos de estado y errores",
            content: `- **200** OK · **201** creado · **204** sin contenido
- **400** entrada inválida · **401** sin sesión · **403** sin permiso · **404** no existe · **409** conflicto

## Un formato de error consistente

\`\`\`json
{
  "error": {
    "code": "invalid_input",
    "message": "El título necesita al menos 3 caracteres"
  }
}
\`\`\`

Mismo formato en todos los endpoints: quien consume la API escribe un único manejador.
`,
          },
        ],
      },
      {
        title: "Seguridad",
        resources: [
          {
            title: "Autenticación y autorización",
            content: `**Autenticación** responde *¿quién eres?*. **Autorización** responde *¿qué puedes hacer?*

1. Identifica al usuario (sesión firmada, magic link…).
2. Guarda su rol en la sesión.
3. Comprueba el rol **en el servidor**, en cada endpoint.

> Nunca confíes en un rol que llegue desde el cliente.

Lecturas recomendadas: [Resumen de seguridad (PDF)](${PDF_URL}).
`,
          },
          {
            title: "Validación de entradas",
            content: `Valida en el borde: cada endpoint rechaza lo que no encaja con su contrato.

\`\`\`ts
const CourseInput = z.object({
  title: z.string().min(3).max(120),
  published: z.boolean().default(false),
});
\`\`\`

- Falla rápido con un **400** y un mensaje útil.
- No devuelvas trazas ni detalles internos.
`,
          },
        ],
      },
    ],
  },
  {
    slug: "docker-para-desarrolladores",
    title: "Docker para desarrolladores",
    description: "Borrador: contenedores, imágenes y compose para levantar tu entorno con un solo comando.",
    published: false,
    sections: [
      {
        title: "Contenedores",
        resources: [
          {
            title: "Qué es un contenedor",
            content: `${video(YOUTUBE.docker, "Docker en 100 segundos")}

Un contenedor empaqueta tu aplicación con sus dependencias y corre igual en cualquier máquina.
`,
          },
        ],
      },
      {
        title: "Docker Compose",
        resources: [
          {
            title: "Tu primer docker-compose.yml",
            content: `\`\`\`yaml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
\`\`\`

Arranca con \`docker compose up -d\`.
`,
          },
        ],
      },
    ],
  },
];

/** Feedback de ejemplo: [alumno, curso.slug, título del recurso, texto, hace N días]. */
export const SEED_FEEDBACK: Array<[string, string, string, string, number]> = [
  ["student1@example.com", "typescript-desde-cero", "Qué problema resuelve TypeScript", "El vídeo de 100 segundos me aclaró todo. ¿Habrá uno sobre tipos avanzados?", 6],
  ["student2@example.com", "typescript-desde-cero", "Instalación y primer archivo", "En Windows tuve que ejecutar la terminal como administrador para `npx tsc --init`.", 4],
  ["student3@example.com", "typescript-desde-cero", "Interfaces y genéricos", "Me perdí un poco en los genéricos; un ejemplo más con arrays ayudaría.", 2],
  ["student1@example.com", "apis-rest-con-criterio", "Códigos de estado y errores", "Muy útil el formato de error. Lo aplicaré en mi proyecto.", 1],
];
